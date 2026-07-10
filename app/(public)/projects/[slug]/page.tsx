import { readData } from "@/lib/data";
import { slugify } from "@/lib/slugify";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await readData<{
    projects: { title: string; subtitle?: string; description?: string; image: string }[];
  }>("projects");

  const project = (data.projects ?? []).find((p) => slugify(p.title) === slug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.title} | Mark Developers`,
    description: project.description || project.subtitle || "",
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await readData<{
    projects: { title: string; subtitle?: string; description?: string; image: string }[];
  }>("projects");

  const project = (data.projects ?? []).find((p) => slugify(p.title) === slug);
  if (!project) notFound();

  return (
    <>
      <section className="relative h-[70vh] w-full overflow-hidden bg-black">
        {project.image && (
          <img
            src={project.image}
            alt={project.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 z-10 flex items-end px-4 pb-16 md:px-8 md:pb-24 lg:px-12 xl:px-24">
          <div className="max-w-4xl">
            <Link
              href="/projects"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              All Projects
            </Link>
            <h1 className="text-4xl font-light leading-tight tracking-wide text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {project.title}
            </h1>
            {project.subtitle && (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl md:text-2xl">
                {project.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {project.description && (
        <section className="relative bg-white px-4 py-16 md:px-8 lg:px-12 xl:px-24">
          <div className="absolute left-0 top-0 h-1 w-full bg-black" />
          <div className="mx-auto">
            <h2 className="text-4xl font-light leading-tight text-black sm:text-5xl">
              About<span className="font-medium">{" "}Project</span>
            </h2>
            <p className="mt-4 md:mt-6 text-lg leading-relaxed text-black/60 sm:text-xl">
              {project.description}
            </p>
          </div>
        </section>
      )}

      <section className="bg-black px-4 py-16 md:px-8 lg:px-12 xl:px-24">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full border border-white px-8 py-3 text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-white hover:text-black"
          >
            All Projects
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
