import { env } from "cloudflare:workers";
import type { ExternalOrder } from "@/lib/external-orders";
import {
  ASTANA_SOURCE_ID, ASTANA_SOURCE_URL, collectAstanaOrders, deadlineExpiresAt,
} from "@/lib/astana-html";

const INTERVAL_MS = 60 * 60 * 1000;
const SCHEDULED_MIN_INTERVAL_MS = 5 * 60 * 1000;
const LEASE_MS = 180 * 1000;
const MAX_ORDERS = 20;
const MAX_HTML_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 8_000;

type SyncRow = {
  id: string;
  last_attempt_at: string | null;
  last_success_at: string | null;
  next_check_at: number;
  lease_until: number;
  lease_token: string | null;
  error: string | null;
};

export type AstanaHubSourceStatus = {
  status: "ready" | "stale" | "error" | "pending";
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  nextCheckAt?: string;
  error?: string;
  intervalMinutes: 60;
  sourceUrl: string;
};

function database(): D1Database {
  if (!env.DB) throw new Error("Database unavailable");
  return env.DB;
}

async function readState(db: D1Database): Promise<SyncRow | null> {
  return db.prepare("SELECT * FROM external_source_syncs WHERE id = ?").bind(ASTANA_SOURCE_ID).first<SyncRow>();
}

function statusFor(row: SyncRow | null, now: number): AstanaHubSourceStatus {
  const status = row?.error ? row.last_success_at ? "stale" : "error"
    : row?.last_success_at ? (row.next_check_at > now ? "ready" : "stale") : "pending";
  return {
    status,
    ...(row?.last_attempt_at ? { lastAttemptAt: row.last_attempt_at } : {}),
    ...(row?.last_success_at ? { lastSuccessAt: row.last_success_at } : {}),
    ...(row?.next_check_at ? { nextCheckAt: new Date(row.next_check_at).toISOString() } : {}),
    ...(row?.error ? { error: row.error } : {}),
    intervalMinutes: 60,
    sourceUrl: ASTANA_SOURCE_URL,
  };
}

async function readOrders(db: D1Database, now: number): Promise<ExternalOrder[]> {
  const result = await db.prepare("SELECT data FROM external_source_orders WHERE source = ? AND expires_at > ? ORDER BY id LIMIT ?")
    .bind(ASTANA_SOURCE_ID, now, MAX_ORDERS).all<{ data: string }>();
  return result.results.map((row) => JSON.parse(row.data) as ExternalOrder)
    .filter((order) => order.source === "Astana Hub" && order.acceptingUntil && deadlineExpiresAt(order.acceptingUntil) > now);
}

async function fetchHtml(url: string): Promise<string> {
  const parsed = new URL(url);
  if (parsed.origin !== "https://astanahub.com" || !parsed.pathname.startsWith("/ru/tech_task/")) throw new Error("SOURCE_URL_REJECTED");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // Public server-rendered pages only. Never use the disallowed /api route,
    // follow an account link, send credentials, or fetch caller-supplied URLs.
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
      headers: { Accept: "text/html", "User-Agent": "Orbit/1.0 (public project directory)" },
    });
    if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("text/html") || !response.body) throw new Error("SOURCE_UNAVAILABLE");
    if (Number(response.headers.get("content-length")) > MAX_HTML_BYTES) throw new Error("SOURCE_TOO_LARGE");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_HTML_BYTES) { await reader.cancel(); throw new Error("SOURCE_TOO_LARGE"); }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    return new TextDecoder().decode(body);
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshIfDue(db: D1Database, now: number, scheduledRefresh = false): Promise<void> {
  await db.prepare("INSERT INTO external_source_syncs (id, next_check_at, lease_until) VALUES (?, 0, 0) ON CONFLICT(id) DO NOTHING")
    .bind(ASTANA_SOURCE_ID).run();
  const token = crypto.randomUUID();
  const stamp = new Date(now).toISOString();
  const lease = await db.prepare("UPDATE external_source_syncs SET last_attempt_at = ?, lease_until = ?, lease_token = ? WHERE id = ? AND (next_check_at <= ? OR (? = 1 AND (last_attempt_at IS NULL OR last_attempt_at <= ?))) AND lease_until <= ? RETURNING id")
    .bind(stamp, now + LEASE_MS, token, ASTANA_SOURCE_ID, now, scheduledRefresh ? 1 : 0, new Date(now - SCHEDULED_MIN_INTERVAL_MS).toISOString(), now).first<{ id: string }>();
  if (!lease) return;
  try {
    const orders = await collectAstanaOrders(now, fetchHtml);
    const owned = "EXISTS (SELECT 1 FROM external_source_syncs WHERE id = ? AND lease_token = ?)";
    const statements = [db.prepare(`DELETE FROM external_source_orders WHERE source = ? AND ${owned}`).bind(ASTANA_SOURCE_ID, ASTANA_SOURCE_ID, token)];
    for (const order of orders) {
      statements.push(db.prepare(`INSERT INTO external_source_orders (id, source, data, expires_at, fetched_at) SELECT ?, ?, ?, ?, ? WHERE ${owned} ON CONFLICT(id) DO UPDATE SET source = excluded.source, data = excluded.data, expires_at = excluded.expires_at, fetched_at = excluded.fetched_at`)
        .bind(order.id, ASTANA_SOURCE_ID, JSON.stringify(order), deadlineExpiresAt(order.acceptingUntil!), stamp, ASTANA_SOURCE_ID, token));
    }
    statements.push(db.prepare("UPDATE external_source_syncs SET last_success_at = ?, next_check_at = ?, lease_until = 0, lease_token = NULL, error = NULL WHERE id = ? AND lease_token = ?")
      .bind(stamp, now + INTERVAL_MS, ASTANA_SOURCE_ID, token));
    // D1 batch executes transactionally: a failed source check or write cannot
    // turn the previous successful snapshot into a partially updated directory.
    await db.batch(statements);
    const state = await readState(db);
    const persisted = await readOrders(db, now);
    if (state?.last_success_at !== stamp || persisted.length !== orders.length || orders.some((order) => !persisted.some((row) => row.id === order.id))) throw new Error("SOURCE_CACHE_VERIFY_FAILED");
  } catch (error) {
    console.error("Astana Hub check failed", error instanceof Error ? error.message : "Unknown error");
    // Preserve every prior row on upstream errors. Expired entries are filtered
    // independently during reads, including when the source remains offline.
    await db.prepare("UPDATE external_source_syncs SET next_check_at = ?, lease_until = 0, lease_token = NULL, error = ? WHERE id = ? AND lease_token = ?")
      .bind(now + INTERVAL_MS, "Не удалось проверить Astana Hub. Показываем последнюю успешную подборку, если она есть.", ASTANA_SOURCE_ID, token).run();
  }
}

export async function getAstanaHubOrders(options: { scheduledRefresh?: boolean } = {}) {
  const db = database();
  const now = Date.now();
  const before = await readState(db);
  // An hourly scheduled invocation may arrive slightly ahead of the cache TTL.
  // Its fixed server-side mode allows that check, with a separate five-minute
  // durable cooldown. Repeated POSTs never bypass the atomic lease/cooldown.
  if (!before || before.next_check_at <= now || options.scheduledRefresh) await refreshIfDue(db, now, options.scheduledRefresh);
  const [orders, state] = await Promise.all([readOrders(db, Date.now()), readState(db)]);
  return { orders, source: statusFor(state, Date.now()) };
}
