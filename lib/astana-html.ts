import type { ExternalOrder } from "./external-orders";

export const ASTANA_SOURCE_URL = "https://astanahub.com/ru/tech_task/?status=success";
export const ASTANA_SOURCE_ID = "astana-hub";

export type AstanaCard = {
  url: string;
  title: string;
  brief: string;
  client: string;
  domain: string;
  deadline: string;
  applicationCount: number;
};

const entities: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };

export function htmlText(value: string): string {
  return value.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (original, entity: string) => {
      if (!entity.startsWith("#")) return entities[entity.toLowerCase()] ?? original;
      const number = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(number) && number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : " ";
    }).replace(/\s+/g, " ").trim();
}

function attribute(attributes: string, name: string): string | undefined {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? htmlText(match[2]) : undefined;
}

function innerByClass(html: string, className: string): string | undefined {
  // These source markers have no same-tag descendants before their text field.
  const match = html.match(new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1\\s*>`, "i"));
  return match?.[2];
}

function heading(html: string, tag: "h2" | "h4"): string {
  return htmlText(html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`, "i"))?.[1] ?? "");
}

export function parseInclusiveDeadline(text: string): string | null {
  const match = text.match(/\b(\d{2})\.(\d{2})\.(\d{2}|\d{4})\b/);
  if (!match) return null;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  const month = Number(match[2]);
  const day = Number(match[1]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return `${year}-${match[2]}-${match[1]}`;
}

export function deadlineExpiresAt(date: string): number {
  // Astana Hub explicitly says “включительно”. Keep the whole deadline date in
  // Kazakhstan, then remove it at 00:00 of the following day (UTC+05:00).
  return Date.parse(`${date}T00:00:00+05:00`) + 24 * 60 * 60 * 1000;
}

export function parseAstanaListing(html: string, pageUrl: string): { cards: AstanaCard[]; nextUrl?: string } {
  if (/class=["'][^"']*\bservice-favorite__not-found\b/i.test(html) && html.includes("Нет технологические задачи") && html.includes("По установленным фильтрам нет результатов") && new URL(pageUrl).searchParams.get("status") === "success") return { cards: [] };
  if (!/class=["'][^"']*\bload-content\b/i.test(html)) throw new Error("SOURCE_LAYOUT_CHANGED");
  const cards: AstanaCard[] = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const classes = attribute(match[1], "class")?.split(/\s+/) ?? [];
    if (!classes.includes("techtask-card")) continue;
    const href = attribute(match[1], "href");
    if (!href) throw new Error("SOURCE_LAYOUT_CHANGED");
    const url = new URL(href, ASTANA_SOURCE_URL);
    if (url.origin !== "https://astanahub.com" || !/^\/ru\/tech_task\/[a-z0-9_-]+\/?$/i.test(url.pathname) || url.search || url.hash) throw new Error("SOURCE_LINK_CHANGED");
    const body = match[2];
    const left = innerByClass(body, "left") ?? "";
    const title = heading(left, "h2");
    const brief = htmlText(left.match(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/i)?.[1] ?? "");
    const client = heading(innerByClass(body, "card-author") ?? "", "h4");
    const fields = new Map<string, string>();
    for (const field of body.matchAll(/<div\b[^>]*class=["'][^"']*\btech-list-item\b[^"']*["'][^>]*>([\s\S]*?)<\/div\s*>/gi)) {
      const paragraphs = [...field[1].matchAll(/<(p|span)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].map((entry) => htmlText(entry[2]));
      if (paragraphs.length >= 2) fields.set(paragraphs[0].toLowerCase(), paragraphs.slice(1).join(" "));
    }
    const deadline = parseInclusiveDeadline(fields.get("прием решений до") ?? "");
    const applications = fields.get("количество заявок") ?? "";
    if (!title || !brief || !client || !deadline || !/^\d+$/.test(applications)) throw new Error("SOURCE_LAYOUT_CHANGED");
    cards.push({ url: url.href, title, brief, client, domain: fields.get("область задачи") ?? "", deadline, applicationCount: Number(applications) });
  }
  // An unexpected empty/challenge page must never wipe the last verified feed.
  if (!cards.length) throw new Error("SOURCE_LAYOUT_CHANGED");
  let nextUrl: string | undefined;
  const next = innerByClass(html, "next-load");
  const href = next?.match(/<a\b([^>]*)>/i)?.[1];
  const nextHref = href ? attribute(href, "href") : undefined;
  if (nextHref) {
    const url = new URL(nextHref, pageUrl);
    const page = Number(url.searchParams.get("page"));
    const currentPage = Number(new URL(pageUrl).searchParams.get("page") || "1");
    if (url.origin !== "https://astanahub.com" || url.pathname !== "/ru/tech_task/" || url.searchParams.get("status") !== "success" || page !== currentPage + 1 || [...url.searchParams.keys()].some((key) => key !== "page" && key !== "status")) throw new Error("SOURCE_PAGINATION_CHANGED");
    nextUrl = url.href;
  }
  return { cards, nextUrl };
}

export type AstanaScope = { category: "website" | "app"; label: string; priority: number; kind: ExternalOrder["kind"] };

export function classifyAstanaCard(card: Pick<AstanaCard, "title" | "brief">): AstanaScope | null {
  const title = card.title.toLowerCase();
  const brief = card.brief.toLowerCase();
  const combined = `${title} ${brief}`;
  if (/прошивк|firmware|ваканси|штатн.{0,15}сотрудник|penetration|проникновени/.test(title)) return null;
  const kind = /ux|ui|дизайн/.test(title) ? "Дизайн" : /доработ|улучш|оптимизац|интеграц/.test(title) ? "Доработка" : "Разработка";
  if (/\bmini\s*app\b|мобильн.{0,24}прилож|\bios\b|\bandroid\b|мобильного ocr/.test(title)) return { category: "app", label: "Приложение", priority: 2, kind };
  if (/(?:^|[^а-яё])бот(?:а|ов|ы|ом|у)?(?:$|[^а-яё])|\bbot\b/.test(title)) {
    if (/веб[-\s]*(?:админ|панел)|web[-\s]*(?:admin|dashboard)/.test(brief)) return { category: "app", label: "Бот с веб-админкой", priority: 2, kind };
    return null;
  }
  if (/сайт|веб[-\s]*сайт|website|landing|лендинг|главно[йя] страниц/.test(title)) return { category: "website", label: "Веб-сайт", priority: 1, kind };
  if (/веб[-\s]*(?:прилож|модул|интерфейс|портал|сервис|панел)|web[-\s]*(?:app|interface|portal)|\bfront[-\s]*end\b/.test(combined)) return { category: "app", label: "Веб-приложение", priority: 3, kind };
  return null;
}

export type AstanaDetail = { location: string; countryCode?: string; budget: string; applicationCount: number };

export function parseAstanaDetail(html: string, card: AstanaCard): AstanaDetail {
  const start = html.search(/class=["'][^"']*\bcard-tech-task\b/i);
  if (start < 0) throw new Error("SOURCE_DETAIL_CHANGED");
  // Restrict markers to the task header; shared footers advertise unrelated apps.
  const header = html.slice(start, html.indexOf('class="card-bd"', start) > start ? html.indexOf('class="card-bd"', start) : start + 24000);
  if (heading(header, "h2") !== card.title) throw new Error("SOURCE_DETAIL_CHANGED");
  const location = htmlText(innerByClass(header, "tech-tash-location") ?? "");
  const amount = htmlText(header.match(/Сумма:\s*<b\b[^>]*>([\s\S]*?)<\/b\s*>/i)?.[1] ?? "");
  const count = htmlText(header.match(/Количество заявок:\s*<b\b[^>]*>([\s\S]*?)<\/b\s*>/i)?.[1] ?? "");
  if (!location || !amount || !/^\d+$/.test(count)) throw new Error("SOURCE_DETAIL_CHANGED");
  const numericAmount = amount.replace(/\s/g, "");
  let budget = "Бюджет не указан";
  if (/^\d+(?:[.,]\d+)?$/.test(numericAmount) && Number(numericAmount.replace(",", ".")) > 0) {
    budget = `${new Intl.NumberFormat("ru-RU").format(Number(numericAmount.replace(",", ".")))} (валюта не указана)`;
  } else if (!/^0(?:[.,]0+)?$/.test(numericAmount) && amount.length < 100) budget = amount;
  return { location, ...(location === "Только РК" ? { countryCode: "KZ" } : {}), budget, applicationCount: Number(count) };
}

export function astanaOrder(card: AstanaCard, scope: AstanaScope, checkedAt: string, detail?: AstanaDetail): ExternalOrder {
  const deadline = card.deadline.split("-").reverse().join(".");
  return {
    id: `astana-hub-${new URL(card.url).pathname.split("/").filter(Boolean).at(-1)}`,
    title: card.title,
    description: `${scope.label}: ${card.client} принимает предложения по технологической задаче. Решения принимаются до ${deadline} включительно. Технические требования доступны в исходной публикации.`,
    category: scope.category,
    budget: detail?.budget ?? "Бюджет не указан",
    tags: [scope.label, ...(card.domain ? [card.domain.slice(0, 70)] : [])],
    source: "Astana Hub",
    sourceUrl: card.url,
    contactLabel: "Открыть заявку",
    contactRestriction: "Предложение подаётся на Astana Hub после входа в аккаунт. Контакты и условия отклика смотрите в исходной заявке. Приём решений открыт по данным источника; количество заявок указано открыто и может измениться.",
    checkedAt,
    ...(detail?.countryCode ? { countryCode: detail.countryCode } : {}),
    location: detail?.location === "Только РК" ? "Казахстан · только РК" : detail?.location ?? "Условия страны — в источнике",
    statusLabel: "Приём решений открыт",
    acceptingUntil: card.deadline,
    deadline: `${deadline} включительно`,
    applicationCount: detail?.applicationCount ?? card.applicationCount,
    kind: scope.kind,
    dateLabel: `Приём до ${deadline}`,
    clientLabel: card.client,
    featured: scope.priority === 1,
  };
}

export async function collectAstanaOrders(now: number, fetchPage: (url: string) => Promise<string>): Promise<ExternalOrder[]> {
  const cards = new Map<string, AstanaCard>();
  const visited = new Set<string>();
  let url: string | undefined = ASTANA_SOURCE_URL;
  for (let page = 0; url && page < 5; page++) {
    if (visited.has(url)) throw new Error("SOURCE_PAGINATION_CHANGED");
    visited.add(url);
    const parsed = parseAstanaListing(await fetchPage(url), url);
    for (const card of parsed.cards) cards.set(card.url, card);
    url = parsed.nextUrl;
  }
  const candidates = [...cards.values()]
    .filter((card) => deadlineExpiresAt(card.deadline) > now)
    .map((card) => ({ card, scope: classifyAstanaCard(card) }))
    .filter((candidate): candidate is { card: AstanaCard; scope: AstanaScope } => Boolean(candidate.scope))
    // Native pagination still finds actual site commissions on later pages.
    .sort((a, b) => a.scope.priority - b.scope.priority || a.card.deadline.localeCompare(b.card.deadline))
    .slice(0, 20);
  const checkedAt = new Date(now).toISOString();
  const orders: ExternalOrder[] = new Array(candidates.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(3, candidates.length) }, async () => {
    while (cursor < candidates.length) {
      const index = cursor++;
      const { card, scope } = candidates[index];
      const detail = index < 12 ? parseAstanaDetail(await fetchPage(card.url), card) : undefined;
      orders[index] = astanaOrder(card, scope, checkedAt, detail);
    }
  }));
  return orders;
}
