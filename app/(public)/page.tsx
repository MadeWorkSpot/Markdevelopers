import HeroSection from "@/components/HeroSection";
import { AboutSection, ServicesSection, ProjectsSection, ContactSection } from "@/components/Sections";

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
      <ContactSection />
    </>
  );
}
