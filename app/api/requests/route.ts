import { getDb } from "@/db";
import { orderRequests } from "@/db/schema";
import { validateWriteOrigin } from "@/lib/admin";
import { readJsonBody, requestError, requestSchema, takeSubmissionSlot } from "@/lib/orders";

export async function POST(request: Request) {
  const originError = validateWriteOrigin(request);
  if (originError) return originError;
  try {
    const parsed = requestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Проверьте поля заявки.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { website, ...payload } = parsed.data;
    if (website) return Response.json({ error: "Не удалось отправить заявку." }, { status: 400 });
    if (!(await takeSubmissionSlot(request))) return Response.json({ error: "Вы уже отправили несколько заявок. Попробуйте снова через час." }, { status: 429, headers: { "Retry-After": "3600" } });
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await getDb().insert(orderRequests).values({ ...payload, id, budget: payload.budget || "Обсудим", deadline: payload.deadline || "По договорённости", createdAt: now, updatedAt: now, status: "new" });
    return Response.json({ id, status: "new", message: "Заявка получена. Она появится на сайте после проверки, если вы разрешили публикацию контактов." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return requestError(error); }
}
