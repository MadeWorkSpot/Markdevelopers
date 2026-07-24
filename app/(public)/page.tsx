import { Suspense } from "react";
import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import { AboutSection, ServicesSection, ProjectsSection, ContactSection } from "@/components/Sections";
import { readData } from "@/lib/data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [, servicesData, projectsData] = await Promise.all([
    readData<{ servicesSectionHeading?: string; projectsSectionHeading?: string }>("site"),
    readData<{ services: { title: string; desc: string }[] }>("services"),
    readData<{ projects: { title: string; subtitle?: string }[] }>("projects"),
  ]);

  const serviceList = (servicesData.services ?? []).map((s) => s.title);
  const projectCount = (projectsData.projects ?? []).length;

  const description = [
    "Mark Developers is a trusted construction company offering",
    serviceList.length > 0 ? serviceList.join(", ").toLowerCase() : "building construction, renovation, and interior design",
    "services.",
    projectCount > 0 ? `With ${projectCount}+ completed projects,` : "With a strong portfolio of completed projects,",
    "we deliver quality craftsmanship and modern architecture.",
  ].join(" ");

  return {
    title: "Mark Developers | Premium Construction & Interior Design Services",
    description,
    keywords: [
      "construction company",
      "building contractors",
      "interior design",
      "renovation services",
      "residential construction",
      "commercial construction",
      "premium builders",
      "Mark Developers",
      "real estate development",
      "architectural design",
      "home renovation",
      "office interior design",
    ],
    openGraph: {
      title: "Mark Developers | Premium Construction & Interior Design Services",
      description,
      url: "https://markdevelopers.in",
      siteName: "Mark Developers",
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: "Mark Developers | Premium Construction & Interior Design Services",
      description,
    },
  };
}

function SectionFallback({ className }: { className?: string }) {
  return <div className={className ?? "h-64 animate-pulse bg-zinc-950"} />;
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<SectionFallback className="h-dvh bg-black" />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<SectionFallback className="bg-white" />}>
        <AboutSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <ServicesSection />
      </Suspense>
      <Suspense fallback={<SectionFallback className="bg-white" />}>
        <ProjectsSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <ContactSection />
      </Suspense>
    </>
  );
}
