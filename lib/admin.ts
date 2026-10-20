import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export async function getAdminSession() {
  const user = await getChatGPTUser();
  const configured = (env as Cloudflare.Env & { ADMIN_EMAIL?: string }).ADMIN_EMAIL ?? "";
  const allowedEmails = configured.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  const host = (await headers()).get("host")?.split(":")[0];
  const localMock = process.env.NODE_ENV === "development" &&
    (host === "localhost" || host === "127.0.0.1") &&
    user?.userId === "local_seedy" && user.email === "seedy@sites.test";
  const isAdmin = Boolean(user && (allowedEmails.includes(user.email.toLowerCase()) || localMock));
  return { user, isAdmin, configured: allowedEmails.length > 0 || localMock };
}

export async function authorizeAdmin() {
  const session = await getAdminSession();
  if (!session.user) return Response.json({ error: "Войдите через ChatGPT, чтобы открыть заявки." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  if (!session.isAdmin) return Response.json({ error: "У этого аккаунта нет доступа к панели администратора." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  return null;
}

export function validateWriteOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Отправьте заявку с сайта Orbit." }, { status: 403 });
  }
  return null;
}
