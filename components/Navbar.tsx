"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef, startTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const defaultLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/#contact", label: "Contact" },
];

const EASE_EXPO = "cubic-bezier(0.76, 0, 0.24, 1)";
const EASE_OUT = "cubic-bezier(0.33, 1, 0.68, 1)";
const EASE_IN = "cubic-bezier(0.32, 0, 0.67, 0)";
const OPEN_DURATION = 600;
const CLOSE_LINK_STAGGER = 40;
const CLOSE_LINK_START = 80;

export default function Navbar({ menuLabel = "Menu", links }: { menuLabel?: string; links?: { href: string; label: string }[] }) {
  const navLinks = links ?? defaultLinks;
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPhase, setMenuPhase] = useState<"hidden" | "entering" | "visible" | "leaving">("hidden");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const linkCount = navLinks.length;
  const closeTotal = CLOSE_LINK_START + linkCount * CLOSE_LINK_STAGGER + OPEN_DURATION;

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    startTransition(() => setMenuOpen(false));
  }, [pathname]);

  useLayoutEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (menuOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMenuPhase("entering");
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMenuPhase("visible");
        });
      });
      return () => cancelAnimationFrame(id);
    } else if (menuPhase !== "hidden") {
      setMenuPhase("leaving");
      closeTimerRef.current = setTimeout(() => {
        setMenuPhase("hidden");
        closeTimerRef.current = null;
      }, closeTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  const showBg = !isHome || scrolled || menuOpen;
  const isVisible = menuPhase === "visible";
  const isLeaving = menuPhase === "leaving";
  const isMounted = menuPhase !== "hidden";

  useEffect(() => {
    if (!menuOpen || !isVisible) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        toggleMenu();
        return;
      }
      if (e.key === "Tab" && menuPanelRef.current) {
        const focusable = menuPanelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const panel = menuPanelRef.current;
    if (panel) {
      const firstLink = panel.querySelector<HTMLElement>('a[href]');
      firstLink?.focus();
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, isVisible, toggleMenu]);

  useEffect(() => {
    if (!menuOpen && toggleBtnRef.current) {
      toggleBtnRef.current.focus();
    }
  }, [menuOpen]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${showBg ? "bg-black" : "bg-transparent"}`}>
      <div className="mx-auto flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-24 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          <img src='/markDevelopersLogo.png' alt="Logo" width={120} height={51} className="brightness-0 invert sm:w-[150px] sm:h-[64px]"/>
        </Link>
        <div className="hidden sm:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-md text-white/70 transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
        <button
          ref={toggleBtnRef}
          onClick={toggleMenu}
          className="sm:hidden relative z-[60] flex items-center gap-3 text-white uppercase text-lg"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <span>{menuOpen ? "Close" : menuLabel}</span>
          <span className="relative flex h-[18px] w-[22px] flex-col justify-between will-change-transform">
            <span
              className="block h-[2px] w-full rounded-full bg-white origin-center"
              style={{
                transition: `transform 500ms ${EASE_EXPO}, translate 400ms ${EASE_EXPO}`,
                transform: isVisible ? "rotate(45deg)" : "rotate(0)",
                translate: isVisible ? "0 8px" : "0 0",
              }}
            />
            <span
              className="block h-[2px] rounded-full bg-white"
              style={{
                transition: `scale 350ms ${EASE_EXPO}, opacity 250ms ease, width 400ms ${EASE_EXPO}`,
                width: isVisible ? "100%" : "60%",
                alignSelf: isVisible ? "stretch" : "flex-end",
                scale: isVisible ? "0 1" : "1 1",
                opacity: isVisible ? 0 : 1,
              }}
            />
            <span
              className="block h-[2px] w-full rounded-full bg-white origin-center"
              style={{
                transition: `transform 500ms ${EASE_EXPO}, translate 400ms ${EASE_EXPO}`,
                transform: isVisible ? "rotate(-45deg)" : "rotate(0)",
                translate: isVisible ? "0 -8px" : "0 0",
              }}
            />
          </span>
        </button>
      </div>

      {isMounted && (
        <>
          <div
            className="sm:hidden fixed inset-0 bg-black/60 z-[55] will-change-[opacity]"
            style={{
              opacity: isVisible ? 1 : 0,
              transition: menuPhase === "entering" ? "none" : `opacity 500ms ${isLeaving ? EASE_IN : EASE_OUT}${isLeaving ? "" : " 200ms"}`,
            }}
            onClick={toggleMenu}
          />

          <div
            ref={menuPanelRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="sm:hidden fixed inset-0 z-[56] flex flex-col justify-center bg-black will-change-[transform]"
            style={{
              transform: isVisible ? "translate3d(0,0,0)" : "translate3d(0,-100%,0)",
              transition: menuPhase === "entering" ? "none" : `transform ${OPEN_DURATION}ms ${isLeaving ? EASE_IN : EASE_EXPO}`,
            }}
          >
            <div
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              style={{
                opacity: isVisible ? 1 : 0,
                transition: menuPhase === "entering" ? "none" : `opacity ${isLeaving ? 300 : 500}ms ${isLeaving ? EASE_IN : EASE_OUT}${isLeaving ? "" : " 200ms"}`,
                willChange: "opacity",
              }}
            />

            <div className="relative flex flex-col items-center justify-center px-8 py-4 gap-2">
              {navLinks.map((link, i) => {
                const openDelay = 100 + i * 60;
                const closeDelay = CLOSE_LINK_START + (linkCount - 1 - i) * CLOSE_LINK_STAGGER;
                const delay = isVisible ? openDelay : isLeaving ? closeDelay : 0;
                const exitDuration = 350;
                const isEntering = menuPhase === "entering";

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group relative flex items-center justify-center gap-4 py-3 text-white/70 hover:text-white transition-colors duration-300"
                    style={{
                      willChange: "transform, opacity",
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translate3d(0,0,0)" : "translate3d(-40px,0,0)",
                      transition: isEntering ? "none" : [
                        `opacity ${exitDuration}ms ${isLeaving ? EASE_IN : EASE_OUT} ${delay}ms`,
                        `transform ${OPEN_DURATION}ms ${isLeaving ? EASE_IN : EASE_EXPO} ${delay}ms`,
                        "color 300ms ease",
                      ].join(", "),
                    }}
                  >
                    <span className="text-4xl font-light tracking-tight">{link.label}</span>
                    <span
                      className="absolute bottom-2 h-px bg-white/20"
                      style={{
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: isVisible ? "calc(100% - 3rem)" : "0%",
                        transition: isEntering ? "none" : `width ${OPEN_DURATION}ms ${isLeaving ? EASE_IN : EASE_EXPO} ${isVisible ? openDelay + 100 : closeDelay - 30}ms`,
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
