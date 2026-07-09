"use client";

import { useState, useEffect, startTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const defaultLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/#contact", label: "Contact" },
];

export default function Navbar({ menuLabel = "Menu", links }: { menuLabel?: string; links?: { href: string; label: string }[] }) {
  const navLinks = links ?? defaultLinks;
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const showBg = !isHome || scrolled || menuOpen;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${showBg ? "bg-black" : "bg-transparent"}`}>
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
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden flex items-center gap-2 text-white uppercase text-lg"
          aria-label="Toggle menu"
        >
          <span>{menuOpen ? "Close" : menuLabel}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="sm:hidden bg-black border-t border-white/10">
          <div className="flex flex-col text-sm px-4 py-4 gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-white/70 transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
