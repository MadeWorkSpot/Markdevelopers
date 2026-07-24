import { readData } from "@/lib/data";
import { slugify } from "@/lib/slugify";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";

export const revalidate = 60;

type ProjectsData = {
  projects: { title: string; subtitle?: string; description?: string; image: string }[];
};

const getProjects = cache(async () => readData<ProjectsData>("projects"));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProjects();

  const project = (data.projects ?? []).find((p) => slugify(p.title) === slug);
  if (!project) return { title: "Project Not Found" };

  const description = project.description || project.subtitle || `${project.title} — a premium construction project by Mark Developers.`;

  return {
    title: project.title,
    description,
    keywords: [
      project.title,
      "construction project",
      "building project",
      "interior design",
      "Mark Developers",
      "premium construction",
    ],
    openGraph: {
      title: `${project.title} | Mark Developers`,
      description,
      url: `https://markdevelopers.in/projects/${slug}`,
      siteName: "Mark Developers",
      type: "article",
      locale: "en_IN",
      ...(project.image && {
        images: [
          {
            url: project.image,
            width: 1200,
            height: 630,
            alt: project.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | Mark Developers`,
      description,
      ...(project.image && { images: [project.image] }),
    },
    alternates: {
      canonical: `https://markdevelopers.in/projects/${slug}`,
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProjects();

  const project = (data.projects ?? []).find((p) => slugify(p.title) === slug);
  if (!project) notFound();

  return (
    <div className="overflow-hidden">
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
          <div className="w-full min-w-0 max-w-4xl">
            <Link
              href="/projects"
              className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              All Projects
            </Link>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-white text-balance break-words">
              {project.title}
            </h1>
            {project.subtitle && (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl md:text-2xl break-words">
                {project.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {project.description && (
        <section className="bg-white px-4 py-16 md:px-8 lg:px-12 xl:px-24">
          <div className="mx-auto max-w-full">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-black text-balance break-words">
              About<span className="font-medium">{" "}Project</span>
            </h2>
            <p className="mt-4 md:mt-6 text-lg leading-relaxed text-black/60 sm:text-xl break-words">
              {project.description}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
