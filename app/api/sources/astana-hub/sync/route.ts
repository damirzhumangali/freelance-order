import { getAstanaHubOrders } from "@/lib/astana-feed";
import { requestError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  // The Site is owner-private. Its platform boundary also admits the bound
  // scheduled service. No visitor identity is needed for this public-data read.
  // Ignore bodies: callers cannot supply URLs, credentials, records, or an
  // arbitrary refresh policy. Scheduled checks have a five-minute durable
  // cooldown so hourly scheduler jitter cannot double the effective interval.
  try {
    const feed = await getAstanaHubOrders({ scheduledRefresh: true });
    return Response.json({ count: feed.orders.length, sources: { astanaHub: feed.source } }, {
      status: feed.source.status === "error" || feed.source.status === "stale" && feed.source.error ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) { return requestError(error); }
}

export async function GET() {
  return Response.json({ error: "Используйте POST для проверки источника." }, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
}
