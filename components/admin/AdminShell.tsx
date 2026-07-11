"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function AdminShell({ children, unreadCount = 0 }: { children: React.ReactNode; unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen bg-zinc-950">
        <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-5">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60 font-bold">M</div>
            <div>
              <p className="text-sm font-medium text-white">Admin Panel</p>
              <p className="text-xs text-white/40">Mark Developers</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
              href={`https://${typeof window !== "undefined" ? window.location.hostname.replace(/^admin\./, "") : "markdevelopers.in"}`}
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
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-8 py-8">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </ConfirmProvider>
  );
}
