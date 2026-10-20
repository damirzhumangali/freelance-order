import { env } from "cloudflare:workers";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { orderRequests } from "@/db/schema";

const plainText = (min: number, max: number, label: string) => z.string().trim().min(min, `${label}: минимум ${min} символа`).max(max, `${label}: максимум ${max} символов`).refine((value) => !Array.from(value).some((character) => {
  const code = character.charCodeAt(0);
  return code < 32 && code !== 9 && code !== 10 && code !== 13 || code === 127;
}), "Недопустимые символы в тексте");

export const requestSchema = z.object({
  name: plainText(2, 100, "Имя"),
  email: z.string().trim().max(254).email("Укажите корректный email"),
  contact: z.union([plainText(3, 160, "Контакт"), z.literal("")]).optional().default(""),
  category: z.enum(["website", "app"], { errorMap: () => ({ message: "Выберите сайт или приложение" }) }),
  title: plainText(5, 140, "Название"),
  description: plainText(20, 6000, "Описание"),
  budget: z.string().trim().max(80, "Бюджет: максимум 80 символов").optional().default(""),
  deadline: z.string().trim().max(80, "Срок: максимум 80 символов").optional().default(""),
  consent: z.boolean(),
  website: z.string().max(200).optional().default(""),
}).strict();

export type OrderRequest = typeof orderRequests.$inferSelect;
export type RequestStatus = OrderRequest["status"];

export async function readJsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("CONTENT_TYPE");
  if (Number(request.headers.get("content-length")) > 20000) throw new Error("BODY_TOO_LARGE");
  if (!request.body) throw new Error("INVALID_JSON");
  const reader = request.body.getReader();
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 20000) { await reader.cancel(); throw new Error("BODY_TOO_LARGE"); }
    chunks.push(value);
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(body)); } catch { throw new Error("INVALID_JSON"); }
}

export async function takeSubmissionSlot(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || "local";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const now = Date.now();
  const bucket = Math.floor(now / 3600000);
  const key = `${hash}:${bucket}`;
  const database = env.DB;
  if (!database) throw new Error("Database unavailable");
  // The conditional UPSERT makes this limit atomic across all Worker instances.
  const slot = await database.prepare("INSERT INTO submission_limits (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 WHERE count < 4 RETURNING key").bind(key, (bucket + 2) * 3600000).first();
  // Expired limit records contain only hashed IP addresses. Keep storage bounded.
  if (slot) await database.prepare("DELETE FROM submission_limits WHERE key IN (SELECT key FROM submission_limits WHERE expires_at < ? LIMIT 100)").bind(now).run();
  return Boolean(slot);
}

export async function getPublicOrders() {
  const rows = await getDb().select().from(orderRequests).where(and(eq(orderRequests.status, "published"), eq(orderRequests.consent, true))).orderBy(desc(orderRequests.publishedAt)).limit(100);
  return rows.map((row) => ({
    id: row.id, title: row.title, description: row.description, category: row.category,
    budget: row.budget, deadline: row.deadline, tags: row.category === "website" ? ["Веб-разработка"] : ["Приложение"],
    clientName: row.name, contact: row.contact, email: row.email,
    createdAt: row.publishedAt ?? row.createdAt, source: "Orbit" as const,
  }));
}

export function requestError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "BODY_TOO_LARGE") return Response.json({ error: "Заявка слишком большая. Сократите описание." }, { status: 413 });
  if (code === "CONTENT_TYPE" || code === "INVALID_JSON") return Response.json({ error: "Не удалось прочитать заявку. Проверьте данные и повторите отправку." }, { status: 400 });
  console.error("Orbit request operation failed", error);
  return Response.json({ error: "Сервис временно недоступен. Попробуйте ещё раз через минуту." }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
