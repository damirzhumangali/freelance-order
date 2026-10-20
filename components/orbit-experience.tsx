"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Bookmark, Menu, X } from "lucide-react";
import "./orbit-experience.css";
import OrbitScene, { type OrbitSceneMotion } from "./orbit-scene";

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
  const storyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef("");
  const isMenuOpen = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const sceneMotion = useRef<OrbitSceneMotion>({ progress: 0, pointerX: 0, pointerY: 0 });

  useEffect(() => {
    const story = storyRef.current;
    const hero = heroRef.current;
    const content = contentRef.current;
    const pin = story?.querySelector<HTMLElement>(".oe-scene-pin");
    const projects = document.getElementById("projects");
    if (!story || !hero || !content || !pin) return;

    // Native document scrolling drives a short pinned camera sequence.
    // No wheel/touch interception or per-frame React renders.
    const staticMode = window.matchMedia("(prefers-reduced-motion: reduce), (max-height: 620px)");
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const phase = (start: number, end: number, value: number) => {
      const t = clamp((value - start) / (end - start));
      return t * t * (3 - 2 * t);
    };
    let frame = 0;
    let previousTime = 0;
    let current = 0;
    let target = 0;
    let pointerX = 0;
    let pointerY = 0;
    let currentX = 0;
    let currentY = 0;
    let storyTop = 0;
    let travel = 1;
    let viewportHeight = 1;
    let alive = true;

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      sceneMotion.current.progress = 0;
      sceneMotion.current.pointerX = 0;
      sceneMotion.current.pointerY = 0;
      story.removeAttribute("data-scroll-active");
      story.removeAttribute("style");
      hero.style.removeProperty("--oe-image-x");
      hero.style.removeProperty("--oe-image-y");
      content.inert = false;
      content.style.removeProperty("visibility");
      projects?.style.removeProperty("--oe-list-progress");
      projects?.classList.remove("oe-list-motion");
    };

    const render = (time: number) => {
      if (!alive || staticMode.matches) { reset(); return; }
      const elapsed = previousTime ? Math.min(64, time - previousTime) : 16.7;
      previousTime = time;
      const ease = 1 - Math.exp(-elapsed / 65);
      current += (target - current) * ease;
      currentX += (pointerX - currentX) * ease;
      currentY += (pointerY - currentY) * ease;
      if (Math.abs(current - target) < 0.0001) current = target;
      const p = current;
      sceneMotion.current.progress = p;
      sceneMotion.current.pointerX = currentX / 5;
      sceneMotion.current.pointerY = currentY / 3.5;
      const framing = phase(0.58, 1, p);
      const camera = phase(0, 0.75, p);
      const title = 1 - phase(0.03, 0.3, p);
      const caption = phase(0.2, 0.43, p) * (1 - phase(0.55, 0.8, p));
      const hasFocus = content.contains(document.activeElement);

      // Read geometry before writing compositor-only scene properties.
      const listProgress = projects ? phase(0, 0.9, (viewportHeight - projects.getBoundingClientRect().top) / viewportHeight) : 1;
      hero.style.setProperty("--oe-image-x", `${currentX.toFixed(2)}px`);
      hero.style.setProperty("--oe-image-y", `${currentY.toFixed(2)}px`);
      story.style.setProperty("--oe-camera-scale", (1.015 + camera * 0.24 - framing * 0.065).toFixed(4));
      story.style.setProperty("--oe-camera-x", `${(-camera * window.innerWidth * 0.035).toFixed(2)}px`);
      story.style.setProperty("--oe-camera-y", `${(-camera * viewportHeight * 0.065).toFixed(2)}px`);
      story.style.setProperty("--oe-camera-roll", `${(-camera * 2.2 + framing * 0.8).toFixed(3)}deg`);
      story.style.setProperty("--oe-camera-tilt", `${(camera * 3.5).toFixed(3)}deg`);
      story.style.setProperty("--oe-frame-inset", `${(framing * Math.min(window.innerWidth * 0.047, 66)).toFixed(2)}px`);
      story.style.setProperty("--oe-frame-radius", `${(framing * 36).toFixed(2)}px`);
      story.style.setProperty("--oe-scene-opacity", (1 - framing * 0.42).toFixed(4));
      story.style.setProperty("--oe-live-opacity", (1 - phase(0.72, 1, p) * 0.88).toFixed(4));
      story.style.setProperty("--oe-veil-opacity", (phase(0.4, 1, p) * 0.34).toFixed(4));
      story.style.setProperty("--oe-title-opacity", (hasFocus ? Math.max(0.8, title) : title).toFixed(4));
      story.style.setProperty("--oe-title-y", `${(-phase(0, 0.5, p) * 76).toFixed(2)}px`);
      story.style.setProperty("--oe-small-opacity", (1 - phase(0.06, 0.27, p)).toFixed(4));
      story.style.setProperty("--oe-caption-opacity", (hasFocus ? 0 : caption).toFixed(4));
      story.style.setProperty("--oe-caption-y", `${((1 - phase(0.18, 0.48, p)) * 42 - phase(0.6, 0.85, p) * 30).toFixed(2)}px`);
      story.style.setProperty("--oe-story-progress", p.toFixed(4));
      content.inert = title < 0.02 && !hasFocus;
      content.style.visibility = content.inert ? "hidden" : "visible";
      projects?.style.setProperty("--oe-list-progress", listProgress.toFixed(4));

      if (Math.abs(target - current) > 0.0001 || Math.abs(pointerX - currentX) + Math.abs(pointerY - currentY) > 0.05) {
        frame = requestAnimationFrame(render);
      } else {
        frame = 0;
        previousTime = 0;
      }
    };

    const update = () => {
      if (staticMode.matches) return;
      target = clamp((window.scrollY - storyTop) / travel);
      // Restored pages and large anchor jumps do not replay offscreen motion.
      if (window.scrollY > storyTop + travel + viewportHeight) current = target;
      if (!frame) frame = requestAnimationFrame(render);
    };
    const measure = () => {
      if (staticMode.matches) { reset(); return; }
      viewportHeight = pin.getBoundingClientRect().height || window.innerHeight;
      storyTop = story.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, story.offsetHeight - viewportHeight);
      target = clamp((window.scrollY - storyTop) / travel);
      current = target;
      story.dataset.scrollActive = "true";
      projects?.classList.add("oe-list-motion");
      update();
    };
    const move = (event: PointerEvent) => {
      if (staticMode.matches || event.pointerType !== "mouse") return;
      const rect = hero.getBoundingClientRect();
      pointerX = (event.clientX / rect.width - 0.5) * -10;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * -7;
      update();
    };
    const leave = () => { pointerX = 0; pointerY = 0; update(); };
    const observer = new ResizeObserver(measure);
    observer.observe(story);
    if (projects) observer.observe(projects);
    measure();
    void document.fonts.ready.then(() => { if (alive) measure(); });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("pageshow", measure);
    window.addEventListener("hashchange", update);
    document.addEventListener("focusin", update);
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", leave, { passive: true });
    staticMode.addEventListener("change", measure);
    return () => {
      alive = false;
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      window.removeEventListener("hashchange", update);
      document.removeEventListener("focusin", update);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      staticMode.removeEventListener("change", measure);
      reset();
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
      <link rel="preload" as="image" href="/images/orbit-courtyard.webp" />
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

      <noscript><style>{`.oe-scroll-story{height:auto!important}.oe-scene-pin{position:relative!important;height:auto!important}.oe-scroll-story .oe-hero{height:100svh!important;min-height:620px!important}.oe-scene-caption,.oe-story-meter{display:none!important}`}</style></noscript>
      <div className="oe-scroll-story" id="orbit-home" ref={storyRef} data-webgl-ready={sceneReady ? "true" : "false"}>
      <div className="oe-scene-pin">
      <section className="oe-hero" ref={heroRef} aria-labelledby="orbit-hero-title">
        <div className="oe-scene-frame" aria-hidden="true">
          <div className="oe-hero-image" />
          <OrbitScene motion={sceneMotion} onReady={setSceneReady} />
          <div className="oe-hero-shade" />
        </div>
        <div className="oe-scene-veil" aria-hidden="true" />
        <div className="oe-hero-topline">
          <p className="oe-overline oe-hero-caption">Сайты. Приложения.<br />Новые возможности.</p>
          <span className="oe-hero-coordinate">ИЗ ИДЕИ — В РЕАЛЬНОСТЬ</span>
        </div>
        <div className="oe-hero-content" ref={contentRef}>
          <p className="oe-hero-preface">У каждого большого проекта<br />есть своя точка притяжения.</p>
          <h1 id="orbit-hero-title"><span>НОВАЯ ОРБИТА</span></h1>
          <div className="oe-hero-bottom">
            <p>Ваши идеи. Ваш талант.<br />Следующий проект, который хочется создать.</p>
            <a href="#projects" className="oe-hero-link">Найти свой проект<span><ArrowUpRight size={21} strokeWidth={1.25} aria-hidden="true" /></span></a>
            <a href="#projects" className="oe-scroll" aria-label="Перейти к заказам"><span /><ArrowDown size={16} strokeWidth={1.2} aria-hidden="true" /></a>
          </div>
        </div>
        <div className="oe-scene-caption" aria-hidden="true">
          <span className="oe-overline">Из идеи — в реальность</span>
          <p>Большие идеи<br />обретают <em>форму.</em></p>
          <span className="oe-scene-caption-note">Сквозь новые перспективы — к вашему проекту.</span>
        </div>
        <div className="oe-story-meter" aria-hidden="true"><span>01</span><span className="oe-meter-track"><span /></span><span>02</span></div>
      </section>
      </div>
      </div>

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
