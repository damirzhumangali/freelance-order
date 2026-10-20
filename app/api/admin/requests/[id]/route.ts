import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { orderRequests } from "@/db/schema";
import { authorizeAdmin, validateWriteOrigin } from "@/lib/admin";
import { readJsonBody, requestError } from "@/lib/orders";

const statusSchema = z.object({ status: z.enum(["new", "reviewing", "published", "closed"]) }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdmin();
  if (denied) return denied;
  const invalidOrigin = validateWriteOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) return Response.json({ error: "Заявка не найдена." }, { status: 404 });
    const payload = statusSchema.safeParse(await readJsonBody(request));
    if (!payload.success) return Response.json({ error: "Выберите допустимый статус заявки." }, { status: 400 });
    const db = getDb();
    const [existing] = await db.select().from(orderRequests).where(eq(orderRequests.id, id)).limit(1);
    if (!existing) return Response.json({ error: "Заявка не найдена." }, { status: 404 });
    if (payload.data.status === "published" && !existing.consent) return Response.json({ error: "Клиент не дал согласия на публикацию контактов. Эта заявка остаётся приватной." }, { status: 409 });
    const now = new Date().toISOString();
    const [updated] = await db.update(orderRequests).set({ status: payload.data.status, updatedAt: now, publishedAt: payload.data.status === "published" ? (existing.publishedAt ?? now) : null }).where(payload.data.status === "published" ? and(eq(orderRequests.id, id), eq(orderRequests.consent, true)) : eq(orderRequests.id, id)).returning();
    if (!updated) return Response.json({ error: "Заявка изменилась. Обновите страницу." }, { status: 409 });
    return Response.json({ request: updated }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return requestError(error); }
}
