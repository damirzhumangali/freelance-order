import { ArrowLeft, ArrowUpRight, Orbit, ShieldCheck } from "lucide-react";
import { chatGPTSignInPath, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { getAdminSession } from "@/lib/admin";
import AdminDashboard from "./requests-dashboard";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Заявки · Orbit Admin" };

export default async function AdminPage() {
  const { user, isAdmin } = await getAdminSession();
  if (user && isAdmin) return <AdminDashboard displayName={user.fullName ?? "Администратор"} signOutPath={chatGPTSignOutPath("/admin")} />;

  return <main className="admin-gate">
    <a href="/" className="admin-gate-back"><ArrowLeft size={16} /> На главную</a>
    <section className="admin-gate-card">
      <a href="/" className="admin-brand"><Orbit size={32} /> orbit<span>®</span></a>
      <div className="admin-gate-icon"><ShieldCheck size={30} /></div>
      <p className="admin-eyebrow">CONTROL CENTER</p>
      <h1>{user ? "Доступ ограничен" : "Все заявки. Один центр."}</h1>
      <p>{user ? "Этот аккаунт не добавлен в список администраторов. Войдите под аккаунтом владельца площадки." : "Войдите в аккаунт администратора, чтобы просматривать новые заявки на сайты и приложения."}</p>
      <a className="admin-primary" target="_top" href={user ? chatGPTSignOutPath("/admin") : chatGPTSignInPath("/admin")}>{user ? "Выйти из аккаунта" : "Войти через ChatGPT"}<ArrowUpRight size={18} /></a>
      <span className="admin-gate-note">Защищённый доступ · только для команды Orbit</span>
    </section>
  </main>;
}
