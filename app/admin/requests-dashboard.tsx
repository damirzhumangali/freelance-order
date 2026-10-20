"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleDot, Clock3, Copy, Inbox, LayoutDashboard, Loader2, LogOut, Mail, Monitor, Orbit, RefreshCw, Search, ShieldCheck, Smartphone, X } from "lucide-react";
import type { OrderRequest, RequestStatus } from "@/lib/orders";

const statusLabels: Record<RequestStatus, string> = { new: "Новые", reviewing: "На проверке", published: "Опубликованы", closed: "Закрыты" };
const statusSingle: Record<RequestStatus, string> = { new: "Новая", reviewing: "На проверке", published: "Опубликована", closed: "Закрыта" };
const date = (value: string) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone: "Asia/Almaty" }).format(new Date(value));

function contactLink(contact: string) {
  if (/^@[a-zA-Z0-9_]{5,32}$/.test(contact)) return `https://t.me/${contact.slice(1)}`;
  if (/^\+?[\d\s()\-]{7,25}$/.test(contact)) return `tel:${contact.replace(/[^\d+]/g, "")}`;
  if (/^https:\/\/t\.me\/[a-zA-Z0-9_]{5,32}\/?$/.test(contact)) return contact;
  return null;
}

export default function AdminDashboard({ displayName, signOutPath }: { displayName: string; signOutPath: string }) {
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState<RequestStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const detailRef = useRef<HTMLElement>(null);

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/requests", { cache: "no-store" });
      const data = await response.json() as { requests?: OrderRequest[]; error?: string };
      if (!response.ok || !Array.isArray(data.requests)) throw new Error(data.error || "Не удалось загрузить заявки.");
      setRequests(data.requests);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить заявки."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadRequests(); }, [loadRequests]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    if (!selectedId) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    detailRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [selectedId]);

  const filtered = useMemo(() => requests.filter((request) =>
    (status === "all" || request.status === status) &&
    (category === "all" || request.category === category) &&
    (!query || [request.title, request.description, request.name, request.email, request.contact].join(" ").toLowerCase().includes(query.toLowerCase()))
  ), [requests, status, category, query]);
  const selected = requests.find((request) => request.id === selectedId);
  const counts = { total: requests.length, new: requests.filter((request) => request.status === "new").length, website: requests.filter((request) => request.category === "website").length, app: requests.filter((request) => request.category === "app").length };

  async function updateStatus(nextStatus: RequestStatus) {
    if (!selected || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/requests/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
      const data = await response.json() as { request?: OrderRequest; error?: string };
      const updated = data.request;
      if (!response.ok || !updated) throw new Error(data.error || "Не удалось изменить статус.");
      setRequests((items) => items.map((request) => request.id === updated.id ? updated : request));
      setNotice(nextStatus === "published" ? "Заказ опубликован на главной странице." : "Статус заявки обновлён.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось изменить статус."); }
    finally { setSaving(false); }
  }

  async function copyContact() {
    if (!selected) return;
    try { await navigator.clipboard.writeText(`${selected.name}\n${selected.email}\n${selected.contact}`); setCopied(true); }
    catch { setError("Не удалось скопировать. Выделите контакт и скопируйте вручную."); }
  }

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <a href="/" className="admin-brand"><Orbit size={30} /> orbit<span>®</span></a>
      <span className="admin-sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</span>
      <a href="/admin" className="admin-nav-active"><LayoutDashboard size={18} /> Заявки <span>{counts.new}</span></a>
      <a href="/" className="admin-nav-link"><ArrowUpRight size={18} /> Открыть площадку</a>
      <div className="admin-sidebar-bottom"><div className="admin-avatar">{displayName.slice(0, 1).toUpperCase()}</div><div><strong>{displayName}</strong><span>Администратор</span></div><a href={signOutPath} target="_top" title="Выйти" aria-label="Выйти из аккаунта"><LogOut size={17} /></a></div>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar"><span><span className="admin-live-dot" /> ORBIT / CONTROL CENTER</span><a href="/">На сайт <ArrowUpRight size={15} /></a></header>
      <div className="admin-content">
        <div className="admin-title-row"><div><p className="admin-eyebrow">ВАШ СЛЕДУЮЩИЙ ПРОЕКТ УЖЕ ЗДЕСЬ</p><h1>Входящие заявки<span>.</span></h1><p>От первого «привет» до нового проекта.</p></div><button className="admin-outline" onClick={() => { setLoading(true); setError(""); void loadRequests(); }} disabled={loading}><RefreshCw size={16} className={loading ? "admin-spin" : ""} /> Обновить</button></div>

        <div className="admin-stat-grid">
          <button onClick={() => { setStatus("all"); setCategory("all"); }}><div><span>Всего заявок</span><Inbox size={18} /></div><strong>{counts.total.toString().padStart(2, "0")}</strong><small>Все обращения клиентов</small></button>
          <button onClick={() => { setStatus("new"); setCategory("all"); }} className="admin-stat-highlight"><div><span>Ждут ответа</span><ArrowDownLeft size={18} /></div><strong>{counts.new.toString().padStart(2, "0")}<span className="admin-live-dot" /></strong><small>Время начать диалог</small></button>
          <button onClick={() => { setCategory("website"); setStatus("all"); }}><div><span>Сайты</span><Monitor size={18} /></div><strong>{counts.website.toString().padStart(2, "0")}</strong><small>От лендинга до платформы</small></button>
          <button onClick={() => { setCategory("app"); setStatus("all"); }}><div><span>Приложения</span><Smartphone size={18} /></div><strong>{counts.app.toString().padStart(2, "0")}</strong><small>Веб и мобильные продукты</small></button>
        </div>

        {notice && <div className="admin-notice" role="status"><CheckCircle2 size={17} />{notice}</div>}
        {error && <div className="admin-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Закрыть ошибку"><X size={16} /></button></div>}

        <section className="admin-queue">
          <div className="admin-queue-heading"><h2>Заявки клиентов <span>{requests.length}</span></h2><span className="admin-private"><ShieldCheck size={14} /> Приватный раздел</span></div>
          <div className="admin-status-tabs" role="tablist" aria-label="Статус заявок">
            {(["all", "new", "reviewing", "published", "closed"] as const).map((item) => <button role="tab" aria-selected={status === item} key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item === "all" ? "Все заявки" : statusLabels[item]}{item === "new" && counts.new > 0 && <span>{counts.new}</span>}</button>)}
          </div>
          <div className="admin-filter-row"><label className="admin-search"><Search size={17} /><input aria-label="Поиск заявок" placeholder="Название, имя или контакт..." value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button onClick={() => setQuery("")} aria-label="Очистить поиск"><X size={14} /></button>}</label><select aria-label="Тип проекта" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Все проекты</option><option value="website">Сайты</option><option value="app">Приложения</option></select></div>

          {loading && requests.length === 0 ? <div className="admin-empty"><Loader2 size={30} className="admin-spin" /><h3>Загружаем заявки</h3><p>Ещё один момент.</p></div> : filtered.length === 0 ? <div className="admin-empty"><div className="admin-empty-icon"><Inbox size={30} /></div><h3>{requests.length ? "Ничего не найдено" : "Всё начинается с заявки"}</h3><p>{requests.length ? "Измените поиск или фильтры, чтобы увидеть другие проекты." : "Заявки на сайты и приложения появятся здесь после отправки формы на главной странице."}</p>{requests.length > 0 ? <button className="admin-outline" onClick={() => { setQuery(""); setStatus("all"); setCategory("all"); }}>Сбросить фильтры</button> : <a className="admin-outline" href="/">Открыть площадку <ArrowUpRight size={15} /></a>}</div> : <div className="admin-request-list"><div className="admin-list-labels"><span>ПРОЕКТ / КЛИЕНТ</span><span>БЮДЖЕТ</span><span>СТАТУС</span><span>ДАТА</span><span /></div>{filtered.map((request) => <button key={request.id} className={`admin-request-row ${request.id === selectedId ? "selected" : ""}`} onClick={() => { setCopied(false); setSelectedId(request.id); }}><span className={`admin-project-icon ${request.category}`}>{request.category === "website" ? <Monitor size={19} /> : <Smartphone size={19} />}</span><span className="admin-project-name"><strong>{request.title}</strong><span>{request.name} <i>·</i> {request.category === "website" ? "Сайт" : "Приложение"}</span></span><span className="admin-row-budget">{request.budget}</span><span className={`admin-status ${request.status}`}><CircleDot size={11} />{statusSingle[request.status]}</span><span className="admin-row-date">{date(request.createdAt)}</span><ChevronRight size={16} className="admin-row-chevron" /></button>)}</div>}
          <div className="admin-queue-footer"><span>Показано {filtered.length} из {requests.length}</span><span><ShieldCheck size={13} /> Контакты доступны только администраторам</span></div>
        </section>
        <footer className="admin-footer"><span>orbit® · Сделано для больших идей</span><span><span className="admin-live-dot" /> Все системы в работе</span></footer>
      </div>
    </main>

    {selected && <div className="admin-detail-overlay" onClick={() => !saving && setSelectedId(null)}><section ref={detailRef} className="admin-detail" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
      if (event.key === "Escape" && !saving) setSelectedId(null);
      if (event.key !== "Tab") return;
      const controls = [...(detailRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], select:not(:disabled), input:not(:disabled)") ?? [])];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}><div className="admin-detail-top"><span className="admin-eyebrow">ЗАЯВКА / {selected.id.slice(0, 8).toUpperCase()}</span><button aria-label="Закрыть заявку" onClick={() => setSelectedId(null)} disabled={saving}><X size={20} /></button></div><div className={`admin-detail-category ${selected.category}`}>{selected.category === "website" ? <Monitor size={24} /> : <Smartphone size={24} />}</div><span className={`admin-status ${selected.status}`}><CircleDot size={11} />{statusSingle[selected.status]}</span><h2 id="admin-detail-title">{selected.title}</h2><div className="admin-detail-meta"><span><Clock3 size={14} /> {date(selected.createdAt)}</span><span>{selected.category === "website" ? "Разработка сайта" : "Разработка приложения"}</span></div><div className="admin-detail-facts"><div><span>Бюджет</span><strong>{selected.budget}</strong></div><div><span>Сроки</span><strong>{selected.deadline}</strong></div></div><h3>О проекте</h3><p className="admin-detail-description">{selected.description}</p><div className="admin-client-card"><div className="admin-client-heading"><h3>Контакт клиента</h3><button onClick={() => void copyContact()} aria-label="Скопировать контакты">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Скопировано" : "Копировать"}</button></div><strong>{selected.name}</strong><a href={`mailto:${encodeURIComponent(selected.email)}`}><Mail size={15} />{selected.email}<ArrowUpRight size={14} /></a>{contactLink(selected.contact) ? <a href={contactLink(selected.contact)!} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={15} />{selected.contact}</a> : <span className="admin-contact-text">{selected.contact}</span>}</div><p className={`admin-consent ${selected.consent ? "allowed" : ""}`}><ShieldCheck size={16} />{selected.consent ? "Клиент разрешил публикацию заявки и контактов." : "Публикация запрещена: клиент не дал согласия. Свяжитесь с ним напрямую."}</p><div className="admin-detail-actions"><label>Статус заявки<select value={selected.status} disabled={saving} onChange={(event) => void updateStatus(event.target.value as RequestStatus)}><option value="new">Новая</option><option value="reviewing">На проверке</option><option value="published" disabled={!selected.consent}>Опубликована</option><option value="closed">Закрыта</option></select></label>{selected.status !== "published" && <button className="admin-primary" disabled={saving || !selected.consent} onClick={() => void updateStatus("published")}>{saving ? <Loader2 size={17} className="admin-spin" /> : <CheckCircle2 size={17} />} Опубликовать заказ <ArrowUpRight size={17} /></button>}{selected.status === "published" && <a className="admin-outline" href="/#orders" target="_blank" rel="noopener noreferrer">Посмотреть на сайте <ArrowUpRight size={16} /></a>}{saving && <span className="admin-saving" role="status">Сохраняем изменения…</span>}</div>{error && <p className="admin-detail-error" role="alert">{error}</p>}{notice && <p className="admin-detail-success" role="status">{notice}</p>}</section></div>}
  </div>;
}
