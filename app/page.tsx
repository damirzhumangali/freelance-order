"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, ArrowRight, Search, Plus, Bookmark, X, Globe2, Smartphone, SlidersHorizontal, LayoutGrid, List, Check, ShieldCheck, ExternalLink, ChevronDown, LoaderCircle, Code2, Mail, RefreshCw, MapPin, Clock3 } from "lucide-react";
import RequestDialog from "../components/request-dialog";
import OrbitExperience from "../components/orbit-experience";
import { getCurrentExternalOrders } from "../lib/external-orders";
type Order = {
    id: string;
    title: string;
    description: string;
    category: "website" | "app";
    budget: string;
    tags: string[];
    source: string;
    sourceUrl?: string;
    contactUrl?: string;
    contactLabel: string;
    contactRestriction?: string;
    checkedAt: string;
    countryCode?: string;
    location?: string;
    statusLabel?: string;
    postedAt?: string;
    acceptingUntil?: string;
    kind: string;
    dateLabel: string;
    clientLabel: string;
    featured?: boolean;
    contact?: string;
    email?: string;
    deadline?: string;
    applicationCount?: number;
};
type AstanaSource = {
    status: "ready" | "stale" | "error" | "pending";
    lastAttemptAt?: string;
    lastSuccessAt?: string;
    nextCheckAt?: string;
    error?: string;
    intervalMinutes: number;
    sourceUrl: string;
};
type PublishedOrder = {
    id: string;
    title: string;
    description: string;
    category: "website" | "app";
    budget: string;
    tags: string[];
    clientName: string;
    contact: string;
    email: string;
    createdAt: string;
    deadline?: string;
};
const categoryNames = { website: "Веб-сайт", app: "Приложение" };
function orderTime(value?: string) { const timestamp = value ? Date.parse(value) : NaN; return Number.isFinite(timestamp) ? timestamp : 0; }
function orderDate(value?: string) { return orderTime(value) ? new Date(value!).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Almaty" }) : ""; }
function checkedTime(value?: string) { return orderTime(value) ? new Date(value!).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" }) : ""; }
function applicationLabel(count: number) { const last = count % 10, lastTwo = count % 100; return `${count} ${last === 1 && lastTwo !== 11 ? "отклик" : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "отклика" : "откликов"}`; }
function budgetParts(value?: string) {
    const budget = value?.trim() || "Не указан";
    const parts = budget.match(/^(.*?)\s*\((валюта не указана)\)$/i);
    return { value: parts ? parts[1].trim() : budget, note: parts ? "Валюта не указана в источнике" : "", muted: /не указан|не указан[ао]|по договор[её]нности/i.test(budget) };
}
function externalActionLabel(order: Order) { return order.contactLabel.trim() || `Откликнуться на ${order.source}`; }
function safeContact(value?: string) { if (!value)
    return; if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return `mailto:${value}`; if (/^@[a-zA-Z0-9_]{5,32}$/.test(value))
    return `https://t.me/${value.slice(1)}`; if (/^\+?[\d\s()-]{7,24}$/.test(value))
    return `tel:${value.replace(/[^+\d]/g, "")}`; try {
    const u = new URL(value);
    if (u.protocol === "https:")
        return u.href;
}
catch { } }
function OrbitMark({ small = false }: {
    small?: boolean;
}) { return <span className={`orbit-mark ${small ? "small" : ""}`} aria-hidden="true"><span /><span /></span>; }
export default function Home() {
    const [orders, setOrders] = useState<Order[]>(() => getCurrentExternalOrders()), [category, setCategory] = useState("all"), [source, setSource] = useState("all"), [query, setQuery] = useState(""), [saved, setSaved] = useState<string[]>([]), [savedOnly, setSavedOnly] = useState(false), [kazakhstanOnly, setKazakhstanOnly] = useState(false), [sort, setSort] = useState("recent"), [view, setView] = useState("grid"), [requestOpen, setRequestOpen] = useState(false), [selected, setSelected] = useState<Order | null>(null), [filtersOpen, setFiltersOpen] = useState(false), [infoOpen, setInfoOpen] = useState(false), [isAdmin, setIsAdmin] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(false), [notice, setNotice] = useState("");
    const searchRef = useRef<HTMLInputElement>(null), detailRef = useRef<HTMLDialogElement>(null);
    const ordersGridRef = useRef<HTMLDivElement>(null);
    const filtersDialogRef = useRef<HTMLDialogElement>(null);
    const revealedOrderIds = useRef(new Set<string>());
    const [astanaSource, setAstanaSource] = useState<AstanaSource>({ status: "pending", intervalMinutes: 60, sourceUrl: "https://astanahub.com/ru/tech_task/" });
    const mountedRef = useRef(false), requestRef = useRef<AbortController | null>(null), hasLoadedRef = useRef(false);
    const knownServerIds = useRef<Set<string> | null>(null);
    const astanaBaselineReady = useRef(false);
    const loadOrders = useCallback(async () => {
        if (!mountedRef.current || requestRef.current) return;
        const controller = new AbortController();
        requestRef.current = controller;
        if (!hasLoadedRef.current) setLoading(true);
        try {
        const r = await fetch("/api/orders", { cache: "no-store", signal: controller.signal });
        if (!r.ok)
            throw Error();
        const d = await r.json() as {
            orders?: PublishedOrder[];
            externalOrders?: Order[];
            sources?: { astanaHub?: AstanaSource };
        };
        if (!mountedRef.current || controller.signal.aborted || requestRef.current !== controller) return;
        const local: Order[] = (d.orders || []).map(o => ({ ...o, source: "Orbit", contactLabel: "Связаться с клиентом", checkedAt: o.createdAt, kind: "Разработка", dateLabel: new Date(o.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", timeZone: "Asia/Almaty" }), clientLabel: o.clientName, featured: true }));
        const serverOrders = [...local, ...(d.externalOrders || [])];
        const newlyArrived = new Set(knownServerIds.current ? serverOrders.filter(order => !knownServerIds.current!.has(order.id) && (order.source !== "Astana Hub" || astanaBaselineReady.current)).map(order => order.id) : []);
        if (!knownServerIds.current) knownServerIds.current = new Set();
        serverOrders.forEach(order => knownServerIds.current!.add(order.id));
        if (d.sources?.astanaHub?.lastSuccessAt || d.sources?.astanaHub?.status === "ready") astanaBaselineReady.current = true;
        const uniqueOrders = new Map<string, Order>();
        [...getCurrentExternalOrders(), ...serverOrders].forEach(order => uniqueOrders.set(order.id, order));
        setOrders(Array.from(uniqueOrders.values()));
        if (d.sources?.astanaHub) setAstanaSource(d.sources.astanaHub);
        if (newlyArrived.size) setNotice(`Добавлено в Orbit: ${newlyArrived.size}. Уже в списке проектов`);
        hasLoadedRef.current = true;
        setError(false);
    }
    catch {
        if (!mountedRef.current || controller.signal.aborted || requestRef.current !== controller) return;
        setError(true);
        setAstanaSource(previous => ({ ...previous, status: previous.lastSuccessAt ? "stale" : "error" }));
    }
    finally {
        if (requestRef.current === controller) {
            requestRef.current = null;
            if (mountedRef.current) setLoading(false);
        }
    } }, []);
    useEffect(() => {
        mountedRef.current = true;
        void loadOrders();
        const refreshVisible = () => { if (document.visibilityState === "visible") void loadOrders(); };
        const timer = window.setInterval(refreshVisible, 60_000);
        document.addEventListener("visibilitychange", refreshVisible);
        return () => {
            mountedRef.current = false;
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", refreshVisible);
            requestRef.current?.abort();
            requestRef.current = null;
        };
    }, [loadOrders]);
    useEffect(() => { const sessionController = new AbortController(); fetch("/api/session", { signal: sessionController.signal }).then(r => r.json()).then(d => { if (!sessionController.signal.aborted) setIsAdmin(Boolean((d as {
        isAdmin?: boolean;
    }).isAdmin)); }).catch(() => { }); try {
        const s = JSON.parse(localStorage.getItem("orbit-saved") || "[]");
        if (Array.isArray(s))
            setSaved(s.filter(v => typeof v === "string"));
    }
    catch { } function key(e: KeyboardEvent) { if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName) && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        searchRef.current?.focus();
    } } document.addEventListener("keydown", key); return () => { sessionController.abort(); document.removeEventListener("keydown", key); }; }, []);
    useEffect(() => { if (!selected) {
        detailRef.current?.close();
        return;
    } const focus = document.activeElement as HTMLElement; const overflow = document.body.style.overflow; document.body.style.overflow = "hidden"; detailRef.current?.showModal(); return () => { detailRef.current?.close(); document.body.style.overflow = overflow; focus?.focus(); }; }, [selected]);
    useEffect(() => { if (!notice)
        return; const t = setTimeout(() => setNotice(""), 3500); return () => clearTimeout(t); }, [notice]);
    function toggleSave(id: string) { setSaved(p => { const next = p.includes(id) ? p.filter(v => v !== id) : [...p, id]; try {
        localStorage.setItem("orbit-saved", JSON.stringify(next));
    }
    catch { } return next; }); }
    const savedCount = orders.filter(order => saved.includes(order.id)).length;
    const kazakhstanCount = orders.filter(order => order.countryCode === "KZ").length;
    const latestCheckedAt = Math.max(0, ...orders.filter(order => order.source !== "Orbit").map(order => orderTime(order.checkedAt)));
    const checkedDateLabel = latestCheckedAt ? new Date(latestCheckedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "Asia/Almaty" }) : "";
    const filtered = orders.filter(o => (category === "all" || o.category === category) && (source === "all" || (source === "orbit" ? o.source === "Orbit" : source === "astana" ? o.source === "Astana Hub" : o.source !== "Orbit")) && (!savedOnly || saved.includes(o.id)) && (!kazakhstanOnly || o.countryCode === "KZ") && `${o.title} ${o.description} ${o.tags.join(" ")} ${o.source} ${o.location || "Удалённый проект"} ${o.countryCode === "KZ" ? "Казахстан Kazakhstan Қазақстан KZ" : o.countryCode || ""}`.toLowerCase().includes(query.toLowerCase().trim())).sort((a, b) => sort === "name" ? a.title.localeCompare(b.title, "ru") : Number(b.countryCode === "KZ") - Number(a.countryCode === "KZ") || orderTime(b.checkedAt) - orderTime(a.checkedAt) || Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    const visibleOrderIds = JSON.stringify(filtered.map(order => order.id));
    useEffect(() => {
        const grid = ordersGridRef.current;
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll<HTMLElement>(".order-card"));
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let observer: IntersectionObserver | undefined;
        const reveal = (card: HTMLElement) => {
            card.dataset.reveal = "visible";
            if (card.dataset.orderId) revealedOrderIds.current.add(card.dataset.orderId);
            observer?.unobserve(card);
        };
        const observeCards = () => {
            observer?.disconnect();
            if (reducedMotion.matches || !("IntersectionObserver" in window)) {
                cards.forEach(reveal);
                return;
            }
            observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) reveal(entry.target as HTMLElement);
                });
            }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
            const revealLine = window.innerHeight * 0.94;
            cards.forEach(card => {
                const alreadySeen = card.dataset.orderId && revealedOrderIds.current.has(card.dataset.orderId);
                if (alreadySeen || card.getBoundingClientRect().top < revealLine || card.contains(document.activeElement)) {
                    reveal(card);
                } else {
                    card.dataset.reveal = "pending";
                    observer?.observe(card);
                }
            });
        };
        const revealFocused = (event: FocusEvent) => {
            const card = event.target instanceof Element ? event.target.closest<HTMLElement>(".order-card") : null;
            if (card && grid.contains(card)) reveal(card);
        };
        observeCards();
        grid.addEventListener("focusin", revealFocused);
        reducedMotion.addEventListener("change", observeCards);
        return () => {
            observer?.disconnect();
            grid.removeEventListener("focusin", revealFocused);
            reducedMotion.removeEventListener("change", observeCards);
            cards.forEach(card => { delete card.dataset.reveal; });
        };
    }, [visibleOrderIds, view]);
    useEffect(() => {
        const dialog = filtersDialogRef.current;
        if (!filtersOpen) { dialog?.close(); return; }
        const previousFocus = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        if (dialog && !dialog.open) dialog.showModal();
        const desktop = window.matchMedia("(min-width: 1051px)");
        const onDesktop = () => { if (desktop.matches) setFiltersOpen(false); };
        desktop.addEventListener("change", onDesktop);
        return () => {
            desktop.removeEventListener("change", onDesktop);
            dialog?.close();
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus({ preventScroll: true });
        };
    }, [filtersOpen]);
    const directContactUrl = selected?.source !== "Orbit" ? safeContact(selected?.contactUrl) : undefined;
    const activeFiltersCount = Number(category !== "all") + Number(source !== "all") + Number(savedOnly) + Number(kazakhstanOnly);
    const categories = [
        { id: "all", label: "Все проекты", short: "Все", count: orders.length, icon: <LayoutGrid size={18}/> },
        { id: "website", label: "Веб-сайты", short: "Сайты", count: orders.filter(o => o.category === "website").length, icon: <Globe2 size={18}/> },
        { id: "app", label: "Приложения", short: "Приложения", count: orders.filter(o => o.category === "app").length, icon: <Smartphone size={18}/> },
    ];
    function resetFilters() { setQuery(""); setCategory("all"); setSource("all"); setSavedOnly(false); setKazakhstanOnly(false); }
    function filterFields(variant: "desktop" | "mobile") {
        return <div className="filter-fields">
            {kazakhstanCount > 0 && <fieldset className="filter-group"><legend>География</legend><button className={`filter-item country-filter ${kazakhstanOnly ? "selected" : ""}`} aria-pressed={kazakhstanOnly} onClick={() => setKazakhstanOnly(!kazakhstanOnly)}><MapPin size={18}/><span>Казахстан</span><i>{kazakhstanCount}</i></button></fieldset>}
            <fieldset className="filter-group"><legend>Источник</legend>{[
                { id: "all", label: "Все источники" }, { id: "orbit", label: "Заявки в Orbit" },
                { id: "astana", label: "Astana Hub", note: "Автообновление" }, { id: "external", label: "Все внешние публикации" },
            ].map(item => <label className="source-choice" key={item.id}><input type="radio" name={`source-${variant}`} checked={source === item.id} onChange={() => setSource(item.id)}/><span>{item.label}{item.note && <small>{item.note}</small>}</span></label>)}</fieldset>
            <fieldset className="filter-group"><legend>Моя подборка</legend><button className={`filter-item saved-filter ${savedOnly ? "selected" : ""}`} aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><Bookmark size={18}/><span>Избранные проекты</span><i>{savedCount}</i></button></fieldset>
        </div>;
    }
    return <div className="site-shell">
        <main>
            <OrbitExperience onRequest={() => setRequestOpen(true)} onInfo={() => setInfoOpen(true)} onSaved={() => { setSavedOnly(true); document.getElementById("projects")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }} savedCount={savedCount} savedOnly={savedOnly}/>
            <section className="projects-section" id="projects">
                <div className="projects-heading">
                    <div className="projects-title"><div className="eyebrow muted">Открытые проекты</div><h2><span>Ваш следующий</span>{" "}<em>проект.</em><span className="count-pill" aria-label={`Количество проектов: ${orders.length}`}>{orders.length}</span></h2><p className="projects-lead">Выберите задачу. Свяжитесь с заказчиком.</p></div>
                    <div className="project-updates"><span className="updated-label">{checkedDateLabel ? `Последняя проверка ${checkedDateLabel}` : "Проверяем опубликованные заявки"}</span><a className={`live-feed-status ${astanaSource.status}`} href={astanaSource.sourceUrl} target="_blank" rel="noopener noreferrer"><span className="live-feed-heading"><span className="status-dot"/>Astana Hub<ArrowUpRight size={15}/></span><small>{astanaSource.status === "stale" || astanaSource.status === "error" ? astanaSource.lastSuccessAt ? "Источник недоступен · сохранённая подборка" : "Пока не удалось загрузить заявки" : astanaSource.status === "pending" ? "Загружаем первую подборку…" : "Автообновление каждый час"}</small>{checkedTime(astanaSource.lastSuccessAt) && <small>Обновлено <time dateTime={astanaSource.lastSuccessAt}>{checkedTime(astanaSource.lastSuccessAt)}</time> · Алматы</small>}</a></div>
                </div>
                <nav className="mobile-category-tabs" aria-label="Направления проектов">{categories.map(item => <button key={item.id} aria-pressed={category === item.id} className={category === item.id ? "selected" : ""} onClick={() => setCategory(item.id)}><span>{item.short}</span><i>{item.count}</i></button>)}</nav>
                <div className="board-layout">
                    <aside className="filter-sidebar" aria-label="Фильтры проектов"><div className="sidebar-title">Направление<SlidersHorizontal size={16}/></div><nav className="desktop-categories" aria-label="Направления проектов">{categories.map(item => <button key={item.id} className={`filter-item ${category === item.id ? "selected" : ""}`} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.icon}<span>{item.label}</span><i>{item.count}</i></button>)}</nav>{filterFields("desktop")}<div className="sidebar-note"><ShieldCheck size={23}/><strong>Сначала —<br/>доверие.</strong><p>Оригинал заявки, способ связи и условия отклика — в каждом проекте.</p><button onClick={() => setInfoOpen(true)}>Как это работает<ArrowUpRight size={16}/></button></div></aside>
                    <div className="project-board">
                        <div className="board-toolbar"><label className="project-search"><Search size={21}/><input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Название или технология…" aria-label="Поиск проектов"/>{query ? <button onClick={() => setQuery("")} aria-label="Очистить поиск"><X size={18}/></button> : <kbd>/</kbd>}</label><div className="toolbar-controls"><button className="mobile-filter-button" aria-haspopup="dialog" aria-expanded={filtersOpen} aria-controls="project-filter-sheet" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={18}/><span>Фильтры</span>{activeFiltersCount > 0 && <b>{activeFiltersCount}</b>}</button><div className="view-switch"><button aria-label="Сетка" aria-pressed={view === "grid"} className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}><LayoutGrid size={18}/></button><button aria-label="Список" aria-pressed={view === "list"} className={view === "list" ? "on" : ""} onClick={() => setView("list")}><List size={19}/></button></div></div></div>
                        <div className="results-toolbar"><span><span className="tiny-dot"/>{savedOnly ? "В избранном" : "Найдено проектов"}<b>{filtered.length}</b></span><label className="sort-label"><select aria-label="Сортировка" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">{kazakhstanCount > 0 ? "Сначала Казахстан" : "По дате проверки"}</option><option value="name">По названию</option></select><ChevronDown size={15}/></label></div>
                        {error && <div className="load-warning">Не удалось обновить заявки. Показана сохранённая подборка.<button onClick={loadOrders}>Повторить<RefreshCw size={15}/></button></div>}
                        <div ref={ordersGridRef} className={`orders-grid ${view === "list" ? "list-view" : ""}`} aria-live="polite">{filtered.map((order, index) => {
                            const price = budgetParts(order.budget);
                            return <article key={order.id} data-order-id={order.id} className={`order-card ${index === 0 ? "first-card" : ""}`} style={{ "--card-delay": `${index % 2 * 60}ms` } as CSSProperties} onMouseMove={e => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return; const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--rx", `${-(e.clientY - r.top - r.height / 2) / 110}deg`); e.currentTarget.style.setProperty("--ry", `${(e.clientX - r.left - r.width / 2) / 110}deg`); }} onMouseLeave={e => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); }}>
                                <div className="card-shine"/><div className="card-top"><span className={`project-icon ${order.category === "app" ? "app-icon" : ""}`}>{order.category === "website" ? <Globe2 size={23}/> : <Smartphone size={23}/>}</span><div className="card-category"><span>{categoryNames[order.category]}</span><small>{order.kind}</small></div><button className={`bookmark-button ${saved.includes(order.id) ? "is-saved" : ""}`} aria-label={saved.includes(order.id) ? "Убрать из избранного" : "Сохранить проект"} aria-pressed={saved.includes(order.id)} onClick={() => toggleSave(order.id)}><Bookmark size={19} fill={saved.includes(order.id) ? "currentColor" : "none"}/></button></div>
                                <div className="order-context"><span className={order.countryCode === "KZ" ? "location-kz" : ""}><MapPin size={13}/>{order.location || "География не указана"}</span>{order.postedAt && <time dateTime={order.postedAt}>{order.dateLabel}</time>}{order.statusLabel && <small>{order.statusLabel}</small>}{typeof order.applicationCount === "number" && <small className="application-count">{applicationLabel(order.applicationCount)}</small>}</div>
                                <button className="card-title" onClick={() => setSelected(order)}><h3>{order.title}</h3></button><p className="card-description">{order.description}</p><div className="tag-list">{order.tags.slice(0, 3).map(tag => <button key={tag} onClick={() => setQuery(tag)}>{tag}</button>)}</div>
                                <div className="card-budget"><span className="budget-label">Бюджет</span><strong className={price.muted ? "muted-budget" : ""}>{price.value}</strong>{price.note && <small className="budget-note">{price.note}</small>}</div><div className="card-deadline"><Clock3 size={14}/><span>{order.deadline ? `${order.source === "Astana Hub" ? "Приём до " : "Срок: "}${order.deadline}` : "Сроки обсуждаются с заказчиком"}</span></div>
                                <div className="card-bottom"><span className="source-badge" title={`Источник проверен ${checkedTime(order.checkedAt)}`}><span className={`source-dot ${order.source === "Orbit" ? "orbit-source" : ""}`}/>{order.source}<span className="source-check"><Check size={12}/></span></span><button onClick={() => setSelected(order)}>Смотреть проект<ArrowUpRight size={18}/></button></div>
                            </article>;
                        })}</div>
                        {filtered.length === 0 && !loading && <div className="empty-state"><Search size={32}/><h3>{orders.length === 0 ? "Свежие заявки появятся здесь" : savedOnly ? "Сохраните интересный проект" : "Пока ничего не нашли"}</h3><p>{orders.length === 0 ? "Добавляем опубликованные запросы после проверки источника и способа связи." : savedOnly ? "Нажмите на закладку в карточке, чтобы вернуться к проекту позже." : "Попробуйте другой запрос или измените фильтры."}</p>{orders.length === 0 ? <button className="button outline" onClick={() => setRequestOpen(true)}>Оставить заявку<Plus size={17}/></button> : <button className="button outline" onClick={resetFilters}>Сбросить фильтры<ArrowRight size={17}/></button>}</div>}
                        <div className="board-footnote"><ShieldCheck size={17}/><span>Astana Hub обновляется каждый час. Telegram — ручная подборка. Условия и актуальность уточняйте в оригинале.</span>{loading && <LoaderCircle size={16} className="spin"/>}</div>
                    </div>
                </div>
            </section>
            <section className="create-banner"><div className="banner-orbit" aria-hidden="true"/><div><span className="eyebrow">ОТ ИДЕИ — К ЗАПУСКУ</span><h2>Теперь —<br/><em>ваш проект.</em></h2><p>Нужен сайт или приложение?<br/>Оставьте задачу и контакт для связи.</p></div><button className="button lime large" onClick={() => setRequestOpen(true)}>Разместить заказ<ArrowUpRight size={20}/></button></section>
        </main>
        <footer className="site-footer"><a href="/" className="brand"><OrbitMark small/><span>orbit<span className="brand-dot">.</span></span></a><span>Место встречи идей и тех, кто их воплощает.</span><a href="/admin">{isAdmin ? "Админ-панель" : "Для администратора"}<ArrowUpRight size={15}/></a><small>© {new Date().getFullYear()} Orbit</small></footer>
        <RequestDialog open={requestOpen} onClose={() => setRequestOpen(false)} onSuccess={() => setNotice("Заявка отправлена в админ-панель")}/>
        <dialog ref={filtersDialogRef} className="mobile-filters-dialog" id="project-filter-sheet" aria-labelledby="project-filter-title" onCancel={() => setFiltersOpen(false)} onClose={() => setFiltersOpen(false)} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) setFiltersOpen(false); } }}><div className="mobile-filters-inner"><div className="filter-sheet-header"><div><span className="eyebrow">Ваша подборка</span><h2 id="project-filter-title">Фильтры проектов</h2></div><button aria-label="Закрыть фильтры" onClick={() => setFiltersOpen(false)}><X size={23}/></button></div>{filterFields("mobile")}<div className="filter-sheet-footer"><button className="filter-reset" onClick={resetFilters}>Сбросить</button><button className="button lime" onClick={() => setFiltersOpen(false)}>Показать {filtered.length}<ArrowRight size={18}/></button></div></div></dialog>
        <dialog ref={detailRef} className="detail-dialog" aria-label="Подробности проекта" onCancel={() => setSelected(null)} onClose={() => setSelected(null)} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) setSelected(null); } }}>{selected && <><div className="detail-dialog-toolbar"><button className="dialog-close" aria-label="Закрыть" onClick={() => setSelected(null)}><X size={22}/></button></div><div className="detail-inner"><div className="detail-eyebrow"><span className="project-icon">{selected.category === "website" ? <Globe2/> : <Smartphone/>}</span><span>{categoryNames[selected.category]} · {selected.kind}</span></div><h2>{selected.title}</h2><div className="detail-order-context"><span><MapPin size={15}/>{selected.location || "География не указана"}</span>{selected.statusLabel && <span>{selected.statusLabel}</span>}{typeof selected.applicationCount === "number" && <span>{applicationLabel(selected.applicationCount)} на исходной площадке</span>}{orderDate(selected.postedAt) && <time dateTime={selected.postedAt}>Размещён {orderDate(selected.postedAt)}</time>}</div><div className="detail-meta"><div className="detail-price"><strong>{budgetParts(selected.budget).value}</strong>{budgetParts(selected.budget).note && <small className="budget-note">{budgetParts(selected.budget).note}</small>}</div><span>{selected.deadline ? `Приём до ${selected.deadline}` : "Сроки — в исходном заказе"}</span></div><p className="detail-description">{selected.description}</p><div className="tag-list">{selected.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="detail-client"><span>Заказчик</span><strong>{selected.clientLabel}</strong></div>{selected.contactRestriction && <div className="contact-notice"><ShieldCheck size={20}/><div><strong>Как связаться</strong><p>{selected.contactRestriction}</p></div></div>}{selected.source === "Orbit" && <div className="own-contact"><strong>Контакты клиента</strong>{selected.contact && <p>{safeContact(selected.contact) ? <a href={safeContact(selected.contact)} target="_blank" rel="noopener noreferrer">{selected.contact}<ArrowUpRight size={16}/></a> : selected.contact}</p>}{selected.email && <a href={`mailto:${selected.email}`}><Mail size={16}/>{selected.email}</a>}</div>}<div className="detail-actions">{selected.sourceUrl ? <a className="button lime" href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">{externalActionLabel(selected)}<ExternalLink size={17}/></a> : <a className="button lime" href={`mailto:${selected.email}`}>Связаться по почте<ArrowUpRight size={17}/></a>}{directContactUrl && <a className="button outline" href={directContactUrl} target="_blank" rel="noopener noreferrer">Написать заказчику<ArrowUpRight size={17}/></a>}<button className="button outline" onClick={() => toggleSave(selected.id)}><Bookmark size={17}/>{saved.includes(selected.id) ? "Сохранено" : "Сохранить"}</button></div><small className="detail-checked">Источник проверен {checkedTime(selected.checkedAt)} по времени Алматы. {selected.source === "Astana Hub" && "Автопроверка каждый час. Число откликов показано на момент проверки. "}Публикация не гарантирует, что исполнитель ещё не найден.</small></div></>}</dialog>
        {infoOpen && <InfoDialog onClose={() => setInfoOpen(false)} onCreate={() => { setInfoOpen(false); setRequestOpen(true); }}/>}
        {notice && <div className="toast" role="status"><Check size={18}/>{notice}</div>}
    </div>;
}

function InfoDialog({ onClose, onCreate }: {
    onClose: () => void;
    onCreate: () => void;
}) { const ref = useRef<HTMLDialogElement>(null); useEffect(() => { const focus = document.activeElement as HTMLElement; const overflow = document.body.style.overflow; document.body.style.overflow = "hidden"; ref.current?.showModal(); return () => { document.body.style.overflow = overflow; focus?.focus(); }; }, []); return <dialog ref={ref} className="detail-dialog info-dialog" aria-label="Как работает Orbit" onCancel={onClose} onClose={onClose} onClick={e => { if (e.target === e.currentTarget) {
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        onClose();
} }}><div className="detail-dialog-toolbar"><button className="dialog-close" aria-label="Закрыть" onClick={onClose}><X size={20}/></button></div><div className="detail-inner"><div className="eyebrow">ВАШ ПУТЬ НА ORBIT</div><h2>Хорошая работа<br />начинается с контакта.</h2>{[{ title: "Найдите свой проект", text: "Выбирайте опубликованные запросы на сайты и приложения. Astana Hub проверяем автоматически каждый час; Telegram подбираем вручную. В карточке указаны источник, доступные даты и способ связи." }, { title: "Свяжитесь с заказчиком", text: "Откройте исходную публикацию и откликнитесь на площадке или напишите по указанному контакту. Условия, сроки и оплату согласуйте напрямую." }, { title: "Или разместите свою идею", text: "Заполните заявку с контактами. Администратор получит её и проверит перед публикацией. Orbit не удерживает комиссию и не проводит оплату." }].map((s, i) => <div className="how-step" key={s.title}><span>0{i + 1}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></div>)}<button className="button lime" onClick={onCreate}>Разместить заказ<Plus size={16}/></button></div></dialog>; }
