"use client";

import { memo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const DURATION = 1.5;
const EASE = "power2.inOut";

export type Slide = {
  src: string;
  alt: string;
  subtitle: string;
  href: string;
  label: string;
};

function ImageCarouselInner({ slides = [] }: { slides?: Slide[] }) {
  const els = useRef<HTMLDivElement[]>([]);
  const idx = useRef(0);
  const busy = useRef(false);

  const slide = useCallback((dir: 1 | -1) => {
    if (busy.current) return;
    const target = (idx.current + dir + slides.length) % slides.length;
    if (target === idx.current) return;
    busy.current = true;

    const out = els.current[idx.current];
    const inn = els.current[target];
    const from = dir * 100;
    const to = dir * -100;

    gsap.set(inn, { xPercent: from, zIndex: 1 });
    gsap.set(out, { zIndex: 0 });

    gsap.timeline({
      onComplete: () => {
        gsap.set(out, { xPercent: from, zIndex: 0 });
        gsap.set(inn, { zIndex: 0 });
        idx.current = target;
        busy.current = false;
      },
    })
      .to(out, { xPercent: to, duration: DURATION, ease: EASE }, 0)
      .to(inn, { xPercent: 0, duration: DURATION, ease: EASE }, 0);
  }, [slides.length]);

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const slideRef = useRef(slide);
  useEffect(() => { slideRef.current = slide; }, [slide]);

  const slideLeft = useCallback(() => { slide(-1); }, [slide]);
  const slideRight = useCallback(() => { slide(1); }, [slide]);

  useEffect(() => {
    const currentEls = els.current;
    currentEls.length = slides.length;
    currentEls.forEach((el, i) => gsap.set(el, { xPercent: i === 0 ? 0 : 100 }));
    slides.forEach((s) => { const img = new Image(); img.src = s.src; });
    const tick = () => slideRef.current(-1);
    timerRef.current = setInterval(tick, 5000);
    return () => {
      clearInterval(timerRef.current);
      currentEls.forEach((el) => gsap.killTweensOf(el));
    };
  }, [slides]);

  const onManual = useCallback((fn: () => void) => {
    fn();
    clearInterval(timerRef.current);
    const tick = () => slideRef.current(-1);
    timerRef.current = setInterval(tick, 5000);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slides.map((s, i) => (
        <div
          key={i}
          ref={(el) => { if (el) els.current[i] = el; }}
          className="absolute inset-0 will-change-transform bg-black"
        >
          {s.src && (
            <img
              src={s.src}
              alt={s.alt}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 z-10 flex items-center px-4 md:px-8 lg:px-16 xl:px-16">
            <div className="max-w-7xl">
              <p className="text-start text-2xl font-light leading-snug tracking-wide text-white sm:text-3xl md:text-4xl lg:text-5xl">
                {s.subtitle}
              </p>
              {s.href?.startsWith("/#") ? (
                <button
                  onClick={() => scrollTo(s.href.slice(2))}
                  className="mt-6 inline-block rounded-full border border-white px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black"
                >
                  {s.label}
                </button>
              ) : (
                <Link
                  href={s.href}
                  className="mt-6 inline-block rounded-full border border-white px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black"
                >
                  {s.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => onManual(slideLeft)}
        className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:left-4 sm:h-12 sm:w-12"
        aria-label="Slide left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 sm:h-6 sm:w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <button
        onClick={() => onManual(slideRight)}
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:right-4 sm:h-12 sm:w-12"
        aria-label="Slide right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 sm:h-6 sm:w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}

export default memo(ImageCarouselInner);
