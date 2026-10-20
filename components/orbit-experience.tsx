"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Bookmark, Menu, X } from "lucide-react";
import "./orbit-experience.css";

type OrbitExperienceProps = {
  onRequest: () => void;
  onInfo: () => void;
  onSaved: () => void;
  savedCount: number;
  savedOnly: boolean;
};

function OrbitEmblem({ className = "" }: { className?: string }) {
  return (
    <svg className={`oe-emblem ${className}`} viewBox="0 0 68 68" fill="none" aria-hidden="true">
      <ellipse cx="34" cy="34" rx="13" ry="29" transform="rotate(-36 34 34)" />
      <ellipse cx="34" cy="34" rx="13" ry="29" transform="rotate(36 34 34)" />
      <circle cx="34" cy="34" r="3" />
    </svg>
  );
}

export default function OrbitExperience({ onRequest, onInfo, onSaved, savedCount, savedOnly }: OrbitExperienceProps) {
  const heroRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef("");
  const isMenuOpen = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!hero || motionPreference.matches) return;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const render = () => {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;
      hero.style.setProperty("--oe-image-x", `${currentX.toFixed(2)}px`);
      hero.style.setProperty("--oe-image-y", `${currentY.toFixed(2)}px`);
      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.08) {
        frame = requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };

    const update = () => {
      if (motionPreference.matches) return;
      const scroll = Math.max(0, Math.min(window.scrollY, hero.offsetHeight));
      targetX = pointerX;
      targetY = Math.min(scroll * 0.09, 70) + pointerY;
      if (!frame) frame = requestAnimationFrame(render);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = hero.getBoundingClientRect();
      pointerX = (event.clientX / rect.width - 0.5) * -12;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
      update();
    };
    const reset = () => {
      pointerX = 0;
      pointerY = 0;
      update();
    };
    const preferenceChanged = () => {
      if (motionPreference.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        hero.style.setProperty("--oe-image-x", "0px");
        hero.style.setProperty("--oe-image-y", "0px");
      } else update();
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", reset, { passive: true });
    motionPreference.addEventListener("change", preferenceChanged);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", reset);
      motionPreference.removeEventListener("change", preferenceChanged);
    };
  }, []);

  useEffect(() => () => {
    if (isMenuOpen.current) document.body.style.overflow = previousOverflow.current;
  }, []);

  function openMenu() {
    if (!dialogRef.current || isMenuOpen.current) return;
    previousFocus.current = document.activeElement as HTMLElement;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    isMenuOpen.current = true;
    dialogRef.current.showModal();
    setMenuOpen(true);
  }

  function closeMenu(action?: () => void) {
    if (isMenuOpen.current) {
      isMenuOpen.current = false;
      dialogRef.current?.close();
      document.body.style.overflow = previousOverflow.current;
      setMenuOpen(false);
      (previousFocus.current || triggerRef.current)?.focus({ preventScroll: true });
    }
    action?.();
  }

  return (
    <>
      <a className="oe-skip" href="#projects">К списку проектов</a>
      <header className="oe-navigation" aria-label="Навигация Orbit">
        <button ref={triggerRef} className="oe-menu-trigger" onClick={openMenu} aria-haspopup="dialog" aria-controls="orbit-navigation-menu" aria-expanded={menuOpen}>
          <Menu size={18} strokeWidth={1.3} aria-hidden="true" />
          <span>Меню</span>
        </button>
        <a href="#orbit-home" className="oe-brand" aria-label="Orbit — главная">
          <OrbitEmblem />
          <span>ORBIT</span>
        </a>
        <button className="oe-inquire" onClick={onRequest}>
          <span>Оставить заявку</span>
          <ArrowUpRight size={15} strokeWidth={1.3} aria-hidden="true" />
        </button>
      </header>

      <section className="oe-hero" id="orbit-home" ref={heroRef} aria-labelledby="orbit-hero-title">
        <div className="oe-hero-image" aria-hidden="true" />
        <div className="oe-hero-shade" aria-hidden="true" />
        <div className="oe-hero-topline">
          <p className="oe-overline oe-hero-caption">Сайты. Приложения.<br />Новые возможности.</p>
          <span className="oe-hero-coordinate">ИЗ ИДЕИ — В РЕАЛЬНОСТЬ</span>
        </div>
        <div className="oe-hero-content">
          <p className="oe-hero-preface">У каждого большого проекта<br />есть своя точка притяжения.</p>
          <h1 id="orbit-hero-title"><span>НОВАЯ ОРБИТА</span></h1>
          <div className="oe-hero-bottom">
            <p>Ваши идеи. Ваш талант.<br />Следующий проект, который хочется создать.</p>
            <a href="#projects" className="oe-hero-link">Найти свой проект<span><ArrowUpRight size={21} strokeWidth={1.25} aria-hidden="true" /></span></a>
            <a href="#orbit-about" className="oe-scroll" aria-label="Узнать о платформе"><span /><ArrowDown size={16} strokeWidth={1.2} aria-hidden="true" /></a>
          </div>
        </div>
        <span className="oe-hero-index" aria-hidden="true">01 — ORBIT</span>
      </section>

      <section className="oe-intro" id="orbit-about" aria-labelledby="orbit-intro-title">
        <div className="oe-intro-kicker"><span className="oe-overline">Пространство возможностей</span><span>01 / О ПЛАТФОРМЕ</span></div>
        <div className="oe-intro-grid">
          <div className="oe-intro-heading">
            <h2 id="orbit-intro-title">Место, где идеи<br />находят <em>своих людей.</em></h2>
            <OrbitEmblem className="oe-intro-emblem" />
          </div>
          <div className="oe-intro-copy">
            <span className="oe-intro-dash" aria-hidden="true" />
            <p>Хорошие проекты начинаются со встречи. Идеи встречают опыт, а талант — возможность создать что-то значимое.</p>
            <p>Мы собираем заказы на сайты и приложения с реальных площадок и принимаем заявки напрямую. В каждом проекте — источник и понятный способ связи.</p>
            <button className="oe-text-link" onClick={onInfo}>Как устроен Orbit<ArrowUpRight size={16} strokeWidth={1.25} aria-hidden="true" /></button>
          </div>
        </div>
        <div className="oe-intro-footer">
          <p>Для тех, кто создаёт.<br /><span>И тех, кто задумал большее.</span></p>
          <a href="#projects" className="oe-intro-projects"><span>Открыть проекты</span><span className="oe-circle-arrow"><ArrowDown size={22} strokeWidth={1.15} aria-hidden="true" /></span></a>
        </div>
      </section>

      <dialog ref={dialogRef} className="oe-menu-dialog" id="orbit-navigation-menu" aria-labelledby="orbit-menu-title" onCancel={event => { event.preventDefault(); closeMenu(); }} onClose={() => { if (isMenuOpen.current) closeMenu(); }}>
        <div className="oe-menu-inner">
          <div className="oe-menu-top"><span className="oe-overline" id="orbit-menu-title">Ваша следующая орбита</span><button className="oe-menu-close" onClick={() => closeMenu()} aria-label="Закрыть меню" autoFocus><span>Закрыть</span><X size={22} strokeWidth={1.15} aria-hidden="true" /></button></div>
          <div className="oe-menu-content">
            <nav className="oe-menu-links" aria-label="Основная навигация">
              <a href="#projects" onClick={() => closeMenu()}><span className="oe-menu-number">01</span><span>Найти проект</span><ArrowUpRight size={34} strokeWidth={0.85} aria-hidden="true" /></a>
              <button onClick={() => closeMenu(onRequest)}><span className="oe-menu-number">02</span><span>Разместить идею</span><ArrowUpRight size={34} strokeWidth={0.85} aria-hidden="true" /></button>
              <button onClick={() => closeMenu(onInfo)}><span className="oe-menu-number">03</span><span>О платформе</span><ArrowUpRight size={34} strokeWidth={0.85} aria-hidden="true" /></button>
            </nav>
            <div className="oe-menu-aside"><OrbitEmblem /><p>Большие идеи<br />начинаются<br /><em>со встречи.</em></p><span>САЙТЫ / ПРИЛОЖЕНИЯ / ЛЮДИ</span></div>
          </div>
          <div className="oe-menu-bottom"><button onClick={() => closeMenu(() => { onSaved(); document.getElementById("projects")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); })} aria-pressed={savedOnly}><Bookmark size={16} strokeWidth={1.3} aria-hidden="true" /><span>Избранные проекты</span><span className="oe-saved-count">{savedCount}</span></button><a href="/admin">Админ-панель<ArrowUpRight size={16} strokeWidth={1.25} aria-hidden="true" /></a><span className="oe-menu-wordmark">ORBIT</span></div>
        </div>
      </dialog>
    </>
  );
}
