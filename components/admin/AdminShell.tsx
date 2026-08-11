"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef, startTransition } from "react";
import { logout } from "@/actions";
import { Toaster } from "./Toaster";
import { ConfirmProvider } from "./ConfirmDialog";

const navItems = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/dashboard/notifications", label: "Notifications" },
  { href: "/admin/dashboard/projects", label: "Projects" },
  { href: "/admin/dashboard/services", label: "Services" },
  { href: "/admin/dashboard/gallery", label: "Gallery" },
  { href: "/admin/dashboard/carousel", label: "Carousel" },
  { href: "/admin/dashboard/about", label: "About Page" },
  { href: "/admin/dashboard/contact", label: "Contact Info" },
  { href: "/admin/dashboard/site", label: "Site Text" },
];

const REFRESH_INTERVAL_MS = 20 * 60 * 60 * 1000; // 20 hours

export default function AdminShell({ children, unreadCount = 0 }: { children: React.ReactNode; unreadCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [siteHost, setSiteHost] = useState("markdevelopers.in");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loggedOutRef = useRef(false);

  const handleAuthExpired = useCallback(() => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    router.push("/admin/login");
  }, [router]);

  useEffect(() => {
    startTransition(() => {
      const hostname = window.location.hostname;
      setSiteHost(hostname.replace(/^admin-dev\./, "").replace(/^admin\./, ""));
    });
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [sidebarOpen]);

  // Global fetch interceptor — redirect to login on 401/403
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401 || response.status === 403) {
        const input = args[0];
        const url = typeof input === "string" ? input : "url" in input ? input.url : "";
        if (url.includes("/admin/")) {
          handleAuthExpired();
        }
      }
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, [handleAuthExpired]);

  // Auto-refresh session before expiry (every 20 hours)
  // Stops permanently if the refresh token is expired/invalid.
  useEffect(() => {
    let cancelled = false;
    const intervalId = setInterval(async () => {
      if (cancelled || loggedOutRef.current) return;
      try {
        const res = await fetch("/admin/api/session/refresh", { method: "POST" });
        if (!res.ok) {
          clearInterval(intervalId);
          handleAuthExpired();
        }
      } catch {
        // Network error — don't stop retrying, try again next interval
      }
    }, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [handleAuthExpired]);

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen bg-zinc-950">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-200 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-5">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60 font-bold">M</div>
            <div>
              <p className="text-sm font-medium text-white">Admin Panel</p>
              <p className="text-xs text-white/40">Mark Developers</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  }`}
                >
                  {item.label}
                  {item.label === "Notifications" && unreadCount > 0 && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-zinc-800 px-3 py-4">
            <a
              href={`https://${siteHost}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
            >
              View Site
            </a>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
              >
                Log out
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile header with hamburger */}
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-white/60 transition-colors hover:bg-zinc-800"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                {sidebarOpen ? (
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                ) : (
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
                )}
              </svg>
            </button>
            <p className="text-sm font-medium text-white">Admin Panel</p>
          </div>

          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </ConfirmProvider>
  );
}
