import Link from "next/link";
import { readData } from "@/lib/data";

export default async function AdminDashboard() {
  const items = [
    { label: "Carousel Slides", href: "/admin/dashboard/carousel", file: "carousel" },
    { label: "Services", href: "/admin/dashboard/services", file: "services" },
    { label: "Projects", href: "/admin/dashboard/projects", file: "projects" },
    { label: "Gallery Images", href: "/admin/dashboard/gallery", file: "gallery" },
    { label: "About Page", href: "/admin/dashboard/about", file: "about" },
    { label: "Contact Info", href: "/admin/dashboard/contact", file: "contact" },
    { label: "Site Text", href: "/admin/dashboard/site", file: "" },
  ];
  const overviews = await Promise.all(
    items.map(async (item) => {
      if (!item.file) return { ...item, count: "—" };
      try {
        const data = await readData<Record<string, unknown>>(item.file);
        const arr = Object.values(data).find((v) => Array.isArray(v)) as unknown[] | undefined;
        const count = arr?.length ?? "—";
        return { ...item, count };
      } catch {
        return { ...item, count: "—" };
      }
    })
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your website content</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviews.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
          >
            <p className="text-sm font-medium text-zinc-400 group-hover:text-white">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">{item.count}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-medium text-zinc-400">Quick Links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/" target="_blank" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
            View Site
          </a>
          <a href="/about" target="_blank" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
            View About Page
          </a>
          <a href="/projects" target="_blank" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
            View Projects
          </a>
          <a href="/gallery" target="_blank" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
            View Gallery
          </a>
        </div>
      </div>
    </>
  );
}
