import Link from "next/link";
import { readData } from "@/lib/data";

const PUBLIC_HOST = process.env.PUBLIC_HOST || "markdevelopers.in";

export default async function AdminDashboard() {
  const origin = `https://${PUBLIC_HOST}`;
  const items = [
    { label: "Carousel Slides", href: "/admin/dashboard/carousel", file: "carousel", view: "/" },
    { label: "Services", href: "/admin/dashboard/services", file: "services", view: "/#services" },
    { label: "Projects", href: "/admin/dashboard/projects", file: "projects", view: "/projects" },
    { label: "Gallery Images", href: "/admin/dashboard/gallery", file: "gallery", view: "/gallery" },
    { label: "About Page", href: "/admin/dashboard/about", file: "about", view: "/about" },
    { label: "Contact Info", href: "/admin/dashboard/contact", file: "contact", view: "/#contact" },
    { label: "Site Text", href: "/admin/dashboard/site", file: "", view: "" },
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
        <h1 className="text-xl font-medium text-white sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your website content</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviews.map((item) => (
          <div
            key={item.href}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
          >
            <Link href={item.href}>
              <p className="text-sm font-medium text-zinc-400 group-hover:text-white">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">{item.count}</p>
            </Link>
            {item.view && (
              <a href={`${origin}${item.view}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-zinc-500 underline transition-colors hover:text-zinc-300">
                View on site ↗
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-medium text-zinc-400">Quick Links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={origin} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
            Home
          </a>
          <a href={`${origin}/about`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
            About
          </a>
          <a href={`${origin}/projects`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
            Projects
          </a>
          <a href={`${origin}/gallery`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
            Gallery
          </a>
          <a href={`${origin}/#contact`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
            Contact
          </a>
        </div>
      </div>
    </>
  );
}
