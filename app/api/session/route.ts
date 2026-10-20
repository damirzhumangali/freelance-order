import { getAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, isAdmin } = await getAdminSession();
  return Response.json({ signedIn: Boolean(user), isAdmin, displayName: user?.displayName ?? null }, { headers: { "Cache-Control": "private, no-store" } });
}
