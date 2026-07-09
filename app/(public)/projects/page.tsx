import { readData } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects | Mark Developers",
  description: "Explore our portfolio of completed construction and design projects.",
};

export default async function ProjectsPage() {
  const data = await readData<{
    pageHeading: string;
    pageSubtitle: string;
    projects: { title: string; location: string; desc: string; image: string }[];
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
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-black/60 sm:text-xl">
          {data.pageSubtitle ?? ""}
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {(data.projects ?? []).map((p) => (
            <div key={p.title} className="group cursor-pointer">
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
                <h2 className="text-xl font-medium text-black">{p.title}</h2>
                <p className="mt-1 text-base text-black/60">{p.location}</p>
                <p className="mt-3 text-sm leading-relaxed text-black/60">{p.desc ?? ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
