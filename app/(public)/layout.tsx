import { Suspense } from "react";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";

function NavbarSkeleton() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black">
      <div className="mx-auto flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-24 py-4">
        <div className="h-[51px] w-[120px] rounded bg-white/[0.07] animate-pulse md:w-[150px]" />
        <div className="hidden md:flex items-center gap-8">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-3 w-12 rounded bg-white/[0.07] animate-pulse" />
          ))}
        </div>
        <div className="md:hidden h-5 w-16 rounded bg-white/[0.07] animate-pulse" />
      </div>
    </nav>
  );
}

function getBaseUrl() {
  return process.env.PUBLIC_HOST
    ? `https://${process.env.PUBLIC_HOST}`
    : "https://markdevelopers.in";
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = getBaseUrl();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mark Developers",
    url: baseUrl,
    logo: `${baseUrl}/markDevelopersLogo.png`,
    description: "Premium building construction, renovation, and interior design services.",
    areaServed: "IN",
    serviceType: ["Construction", "Interior Design", "Renovation", "Real Estate Development"],
  };
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Mark Developers",
    url: baseUrl,
    logo: `${baseUrl}/markDevelopersLogo.png`,
    description: "Premium building construction, renovation, and interior design services.",
    areaServed: "IN",
    serviceType: ["Construction", "Interior Design", "Renovation", "Real Estate Development"],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Suspense fallback={<NavbarSkeleton />}>
        <NavbarWrapper />
      </Suspense>
      <main>{children}</main>
      <Suspense fallback={<div className="h-64 animate-pulse bg-zinc-950" />}>
        <Footer />
      </Suspense>
    </>
  );
}
