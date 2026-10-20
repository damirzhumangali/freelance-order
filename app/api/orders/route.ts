import { getPublicOrders, requestError } from "@/lib/orders";
import { getAstanaHubOrders } from "@/lib/astana-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [orders, astanaHub] = await Promise.all([getPublicOrders(), getAstanaHubOrders()]);
    return Response.json({ orders, externalOrders: astanaHub.orders, sources: { astanaHub: astanaHub.source } }, { headers: { "Cache-Control": "no-store" } });
  }
  catch (error) { return requestError(error); }
}
