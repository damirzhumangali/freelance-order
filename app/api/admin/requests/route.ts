import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { orderRequests } from "@/db/schema";
import { authorizeAdmin } from "@/lib/admin";
import { requestError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await authorizeAdmin();
  if (denied) return denied;
  try {
    const requests = await getDb().select().from(orderRequests).orderBy(desc(orderRequests.createdAt)).limit(500);
    return Response.json({ requests }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return requestError(error); }
}
