import { getPublicOrders, requestError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return Response.json({ orders: await getPublicOrders() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return requestError(error); }
}
