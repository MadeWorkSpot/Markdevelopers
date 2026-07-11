import { Suspense } from "react";
import HeroSection from "@/components/HeroSection";
import { AboutSection, ServicesSection, ProjectsSection, ContactSection } from "@/components/Sections";

export const revalidate = 60;

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
