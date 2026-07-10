"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { slugify } from "@/lib/slugify";

export type Project = {
  title: string;
  subtitle: string;
  image: string;
};

function getVisibleCards() {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
}

export default function ProjectsCarousel({
  projects = [],
  heading = "Featured Projects",
  viewAllLabel = "View All Projects",
}: {
  projects?: Project[];
  heading?: string;
  viewAllLabel?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(3);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  useEffect(() => {
    const onResize = () => setVisible(getVisibleCards());
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const totalItems = projects.length + 1;
  const maxIdx = totalItems - visible;

  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx((i) => Math.min(maxIdx, i + 1)), [maxIdx]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!isSwiping.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwiping.current = true;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) next();
    else if (dx > 50) prev();
    isSwiping.current = false;
  }, [next, prev]);

  const atStart = idx === 0;
  const atEnd = idx >= maxIdx;

  const headingParts = heading.split(" ");
  const firstWords = headingParts.slice(0, -1).join(" ");
  const lastWord = headingParts[headingParts.length - 1] ?? "";

  return (
    <div className="mx-auto max-w-full">
      <h2 className="text-4xl font-light leading-tight text-black sm:text-5xl">
        {firstWords}{" "}
        <span className="font-medium">{lastWord}</span>
      </h2>

      <div className="relative mt-14">
        <div
          className="overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${idx * (100 / visible)}%)` }}
          >
            {projects.map((p) => (
              <div
                key={p.title}
                className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3 px-4"
              >
                <Link href={`/projects/${slugify(p.title)}`} className="group block cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden">
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.title}
                        className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="mt-5">
                    <h3 className="text-base font-medium text-black sm:text-lg">{p.title}</h3>
                    {p.subtitle && (
                      <p className="mt-1 text-base text-black/60">{p.subtitle}</p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
            <div className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3 px-4">
              <Link
                href="/projects"
                className="group flex aspect-[4/3] items-center justify-center border border-black/10 bg-white transition-all hover:shadow-lg"
              >
                <div className="text-center px-4">
                  <span className="text-sm font-medium text-black/40 transition-colors group-hover:text-black">
                    {viewAllLabel}
                  </span>
                  <div className="mt-2 text-2xl text-black/20 transition-colors group-hover:text-black/60">
                    &rarr;
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <button
          onClick={prev}
          disabled={atStart}
          className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/20 bg-white text-black shadow-sm transition-all hover:border-black hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-black/20 disabled:hover:shadow-none sm:-left-4 sm:h-12 sm:w-12"
          aria-label="Previous projects"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 sm:h-5 sm:w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={next}
          disabled={atEnd}
          className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/20 bg-white text-black shadow-sm transition-all hover:border-black hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-black/20 disabled:hover:shadow-none sm:-right-4 sm:h-12 sm:w-12"
          aria-label="Next projects"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 sm:h-5 sm:w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
