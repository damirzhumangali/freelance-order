"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Check, CheckCheck, Globe2, LoaderCircle, ShieldCheck, Smartphone, X } from "lucide-react";
import "./request-dialog.css";

type RequestDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const focusableSelector =
  'button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function RequestDialog({ open, onClose, onSuccess }: RequestDialogProps) {
  const mounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
  if (!mounted || !open) return null;
  return createPortal(<RequestDialogContent onClose={onClose} onSuccess={onSuccess} />, document.body);
}

function RequestDialogContent({ onClose, onSuccess }: Omit<RequestDialogProps, "open">) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef(onClose);
  const requestRef = useRef<AbortController | null>(null);
  const [category, setCategory] = useState<"website" | "app">("website");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight || "0") + scrollbarWidth}px`;
    }

    if (!dialog.open) dialog.showModal();
    const focusFrame = requestAnimationFrame(() => {
      dialog.querySelector<HTMLInputElement>('input[name="title"]')?.focus({ preventScroll: true });
    });

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true",
      );
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trapFocus);

    return () => {
      cancelAnimationFrame(focusFrame);
      requestRef.current?.abort();
      requestRef.current = null;
      dialog.removeEventListener("keydown", trapFocus);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (sent) successRef.current?.focus({ preventScroll: true });
  }, [sent]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestRef.current || !formRef.current) return;
    const minimumLengths = [
      ["title", 5, "Введите название проекта: минимум 5 символов."],
      ["description", 20, "Добавьте немного деталей: минимум 20 символов."],
      ["name", 2, "Укажите имя: минимум 2 символа."],
      ["contact", 3, "Укажите контакт полностью или оставьте поле пустым."],
    ] as const;
    for (const [name, minimum, message] of minimumLengths) {
      const input = formRef.current.elements.namedItem(name);
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
        const length = input.value.trim().length;
        input.setCustomValidity(length < minimum && (name !== "contact" || length > 0) ? message : "");
      }
    }
    if (!formRef.current.reportValidity()) return;
    const form = new FormData(formRef.current);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const controller = new AbortController();
    requestRef.current = controller;
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          category,
          title: value("title"),
          description: value("description"),
          budget: value("budget"),
          deadline: value("deadline"),
          name: value("name"),
          email: value("email"),
          contact: value("contact"),
          consent: form.get("consent") === "on",
          website: value("website"),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Не получилось отправить заявку. Попробуйте ещё раз.";
        throw new Error(message);
      }
      if (controller.signal.aborted) return;
      setSent(true);
      onSuccess?.();
    } catch (reason) {
      if (controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : "Проверьте соединение и попробуйте ещё раз.");
    } finally {
      if (!controller.signal.aborted) setSending(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  function requestClose() {
    // Cancelling fetch cannot cancel a write the server already accepted.
    // Keep the dialog open until the submission result is known.
    if (!requestRef.current) closeRef.current();
  }

  function handleBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      requestClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="orbit-request-dialog"
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-intro`}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={handleBackdrop}
    >
      <div className="orbit-request-toolbar">
        <button className="orbit-request-close" type="button" aria-label="Закрыть форму" onClick={requestClose} disabled={sending}>
          <X size={20} strokeWidth={1.6} />
        </button>
      </div>

      {sent ? (
        <div className="orbit-request-success">
          <div className="orbit-request-success-icon"><CheckCheck size={34} strokeWidth={1.4} /></div>
          <span className="orbit-request-eyebrow">ПЕРВЫЙ ШАГ СДЕЛАН</span>
          <h2 id={`${id}-heading`} ref={successRef} tabIndex={-1}>Проект на орбите.</h2>
          <p id={`${id}-intro`}>Заявка отправлена администратору. После проверки она появится в списке заказов вместе с указанными контактами.</p>
          <div className="orbit-request-success-note"><ShieldCheck size={18} /><span>Каждую заявку проверяем вручную.</span></div>
          <button className="orbit-request-submit" type="button" onClick={onClose}>Отлично<ArrowUpRight size={19} /></button>
        </div>
      ) : (
        <>
          <header className="orbit-request-header">
            <span className="orbit-request-eyebrow"><span /> НОВЫЙ ПРОЕКТ</span>
            <h2 id={`${id}-heading`}>У каждой идеи<br />есть <em>свой исполнитель.</em></h2>
            <p id={`${id}-intro`}>Расскажите о задаче. Мы проверим заявку и опубликуем её для разработчиков.</p>
          </header>

          <form ref={formRef} onSubmit={handleSubmit} className="orbit-request-form" aria-busy={sending} onInput={(event) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) event.target.setCustomValidity("");
          }}>
            <fieldset className="orbit-request-category">
              <legend>Что будем создавать?</legend>
              <label className={category === "website" ? "is-selected" : ""}>
                <input type="radio" name="category" value="website" checked={category === "website"} onChange={() => setCategory("website")} />
                <Globe2 size={21} strokeWidth={1.4} /><span>Сайт</span><span className="orbit-request-radio"><Check size={12} strokeWidth={3} /></span>
              </label>
              <label className={category === "app" ? "is-selected" : ""}>
                <input type="radio" name="category" value="app" checked={category === "app"} onChange={() => setCategory("app")} />
                <Smartphone size={21} strokeWidth={1.4} /><span>Приложение</span><span className="orbit-request-radio"><Check size={12} strokeWidth={3} /></span>
              </label>
            </fieldset>

            <div className="orbit-request-field">
              <label htmlFor={`${id}-title`}>Название проекта <span>*</span></label>
              <input id={`${id}-title`} name="title" placeholder="Например, интернет-магазин для локального бренда" required minLength={5} maxLength={140} />
            </div>
            <div className="orbit-request-field">
              <label htmlFor={`${id}-description`}>Расскажите о задаче <span>*</span></label>
              <textarea id={`${id}-description`} name="description" placeholder="Что нужно сделать, для кого и какие функции важны?" required minLength={20} maxLength={6000} rows={3} />
            </div>
            <div className="orbit-request-columns">
              <div className="orbit-request-field">
                <label htmlFor={`${id}-budget`}>Бюджет <small>необязательно</small></label>
                <input id={`${id}-budget`} name="budget" placeholder="Например, 300 000 ₸" maxLength={80} />
              </div>
              <div className="orbit-request-field">
                <label htmlFor={`${id}-deadline`}>Сроки <small>необязательно</small></label>
                <input id={`${id}-deadline`} name="deadline" placeholder="Например, 3–4 недели" maxLength={80} />
              </div>
            </div>

            <div className="orbit-request-section-label"><span>Как с вами связаться</span><span>02 / 02</span></div>
            <div className="orbit-request-columns">
              <div className="orbit-request-field">
                <label htmlFor={`${id}-name`}>Ваше имя <span>*</span></label>
                <input id={`${id}-name`} name="name" autoComplete="name" placeholder="Как к вам обращаться" required minLength={2} maxLength={100} />
              </div>
              <div className="orbit-request-field">
                <label htmlFor={`${id}-email`}>Электронная почта <span>*</span></label>
                <input id={`${id}-email`} name="email" type="email" autoComplete="email" placeholder="you@company.com" required maxLength={254} />
              </div>
            </div>
            <div className="orbit-request-field">
              <label htmlFor={`${id}-contact`}>Telegram или телефон <small>необязательно</small></label>
              <input id={`${id}-contact`} name="contact" autoComplete="tel" placeholder="@username или +7…" minLength={3} maxLength={160} />
            </div>

            <div className="orbit-request-honeypot" aria-hidden="true">
              <label htmlFor={`${id}-website`}>Ваш сайт</label>
              <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <label className="orbit-request-consent">
              <input type="checkbox" name="consent" required />
              <span>Разрешаю опубликовать описание и контакты после проверки. <small>Указанные имя, почта и дополнительный контакт будут видны посетителям сайта.</small></span>
            </label>

            {error && <p className="orbit-request-error" role="alert">{error}</p>}
            <div className="orbit-request-footer">
              <span role={sending ? "status" : undefined}><ShieldCheck size={16} />{sending ? "Дождитесь подтверждения отправки" : "Сначала проверка, затем публикация"}</span>
              <button className="orbit-request-submit" type="submit" disabled={sending}>
                {sending ? <><LoaderCircle className="orbit-request-spinner" size={18} /> Отправляем…</> : <>Отправить заявку<ArrowUpRight size={19} /></>}
              </button>
            </div>
          </form>
        </>
      )}
    </dialog>
  );
}
