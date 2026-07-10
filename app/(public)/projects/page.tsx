import { readData } from "@/lib/data";
import { slugify } from "@/lib/slugify";
import Link from "next/link";

export const revalidate = 60;

export const metadata = {
  title: "Projects | Mark Developers",
  description: "Explore our portfolio of completed construction and design projects.",
};

export default async function ProjectsPage() {
  const data = await readData<{
    pageHeading: string;
    pageSubtitle: string;
    projects: { title: string; subtitle: string; description: string; image: string }[];
  }>("projects");

  const headingParts = (data.pageHeading ?? "").split(" ");
  const firstWords = headingParts.slice(0, -1).join(" ");
  const lastWord = headingParts[headingParts.length - 1] ?? "";

  return (
    <section className="bg-white px-4 py-24 pt-36 md:px-8 lg:px-12 xl:px-24">
      <div className="mx-auto max-w-full">
        <h1 className="mt-4 text-5xl font-light leading-tight text-black sm:text-6xl">
          {firstWords}{" "}
          <span className="font-medium">{lastWord}</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-snug text-black/60 sm:text-xl">
          {data.pageSubtitle ?? ""}
        </p>
        <div className="mt-4 md:mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {(data.projects ?? []).map((p) => (
            <Link
              key={p.title}
              href={`/projects/${slugify(p.title)}`}
              className="group cursor-pointer"
            >
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
                <h2 className="text-lg font-medium text-black sm:text-xl">{p.title}</h2>
                {p.subtitle && (
                  <p className="mt-1 text-base text-black/60">{p.subtitle}</p>
                )}
                {p.description && (
                  <p className="mt-3 text-sm leading-relaxed text-black/60 line-clamp-1">{p.description}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-black/40 transition-colors group-hover:text-black">
                  View Project
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
