import Link from "next/link";
import ProjectsCarousel from "@/components/ProjectsCarousel";
import ContactForm from "@/components/ContactForm";
import { readData } from "@/lib/data";

export async function AboutSection() {
  const about = await readData<{
    hero: { image: string; alt: string; heading: string; description: string };
    stats: { number: string; label: string }[];
  }>("about");
  const site = await readData<{ learnMoreLabel: string }>("site");

  const parts = (about.hero?.heading ?? "").split("&");
  const headingStart = parts[0]?.trim() ?? "";
  const headingEnd = parts[1]?.trim() ?? "";

  return (
    <section className="relative bg-white px-4 py-16 md:py-24 md:px-8 lg:px-12 xl:px-24">
      <div className="absolute left-0 top-0 h-1 w-full bg-black" />
      <div className="mx-auto max-w-full">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
          <div className="lg:w-1/2">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-black text-balance">
              {headingStart}
              {headingEnd && (
                <span className="block font-medium">{headingEnd}</span>
              )}
            </h2>
            <p className="mt-4 md:mt-8 text-md sm:text-lg lg:text-xl leading-snug text-black/60">
              {about.hero?.description ?? ""}
            </p>
            {(about.stats ?? []).length > 0 && (
              <div className="mt-6 md:mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {(about.stats ?? []).map((s) => (
                  <div key={s.label}>
                    <p className="text-3xl font-medium text-black sm:text-4xl">{s.number}</p>
                    <p className="mt-1 text-xs text-black/60 sm:text-sm">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/about"
              className="mt-4 md:mt-8 inline-flex items-center gap-2 rounded-full border border-black px-8 py-3 text-sm font-medium uppercase tracking-wider text-black transition-all hover:bg-black hover:text-white"
            >
              {site.learnMoreLabel ?? "Learn More"}
            </Link>
          </div>
          <div className="group overflow-hidden lg:w-1/2">
            {about.hero?.image && (
              <img
                src={about.hero.image}
                alt={about.hero.alt}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export async function ServicesSection() {
  const { services } = await readData<{
    services: { title: string; desc: string; image: string }[];
  }>("services");
  const site = await readData<{
    servicesSectionHeading: string;
    viewAllServicesLabel: string;
  }>("site");

  const headingParts = (site.servicesSectionHeading ?? "").split(" ");
  const firstWords = headingParts.slice(0, -1).join(" ");
  const lastWord = headingParts[headingParts.length - 1] ?? "";

  return (
    <section id="services" className="relative bg-black px-4 py-16 md:py-24 md:px-8 lg:px-12 xl:px-24">
      <div className="mx-auto max-w-full">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-white text-balance">
            {firstWords} {" "}
            <span className="font-medium">{lastWord}</span>
          </h2>
        </div>
        <div className="mt-4 md:mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {(services ?? []).map((s) => (
            <div key={s.title} className="group cursor-pointer">
              <div className="aspect-[16/9] overflow-hidden">
                {s.image && (
                  <img
                    src={s.image}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-md sm:text-base md:text-lg font-medium text-white text-balance">{s.title}</h3>
                <p className="mt-2 text-sm md:text-md leading-tight text-white/60">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function ProjectsSection() {
  const { projects } = await readData<{
    projects: { title: string; subtitle: string; image: string }[];
  }>("projects");
  const site = await readData<{
    projectsSectionHeading: string;
    viewAllProjectsLabel: string;
  }>("site");
  return (
    <section className="relative bg-white px-4 py-16 md:py-24 md:px-8 lg:px-12 xl:px-24">
      <ProjectsCarousel
        projects={projects}
        heading={site.projectsSectionHeading ?? "Featured Projects"}
        viewAllLabel={site.viewAllProjectsLabel ?? "View All Projects"}
      />
    </section>
  );
}

export async function ContactSection() {
  const contact = await readData<{
    email: string;
    phone: string;
    address: string;
    heading: string;
    description: string;
    hours: { day: string; time: string }[];
  }>("contact");

  const site = await readData<{
    contactNameLabel: string;
    contactNamePlaceholder: string;
    contactEmailLabel: string;
    contactEmailPlaceholder: string;
    contactMessageLabel: string;
    contactMessagePlaceholder: string;
    sendMessageLabel: string;
    contactDetailsHeading: string;
    officeHoursHeading: string;
  }>("site");

  return (
    <section id="contact" className="bg-black px-4 py-16 md:py-24 md:px-8 lg:px-12 xl:px-24">
      <div className="mx-auto max-w-full">
        <div className="flex flex-col">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-white text-balance">
            {contact.heading ?? ""}
          </h2>
          <p className="mt-4 md:mt-6 max-w-3xl text-md sm:text-lg lg:text-xl leading-snug text-white/60">
            {contact.description ?? ""}
          </p>
        </div>

        <div className="mt-6 md:mt-10 grid gap-16 lg:grid-cols-2">
          <ContactForm
            nameLabel={site.contactNameLabel ?? "Name"}
            namePlaceholder={site.contactNamePlaceholder ?? "Your name"}
            emailLabel={site.contactEmailLabel ?? "Email"}
            emailPlaceholder={site.contactEmailPlaceholder ?? "you@example.com"}
            messageLabel={site.contactMessageLabel ?? "Message"}
            messagePlaceholder={site.contactMessagePlaceholder ?? "How can we help?"}
            sendMessageLabel={site.sendMessageLabel ?? "Send Message"}
          />

          <div className="space-y-12">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-white">{site.contactDetailsHeading || "Contact Details"}</h3>
              <div className="space-y-2 text-base text-white/60">
                <p>{contact.email ?? ""}</p>
                <p>{contact.phone ?? ""}</p>
                {(contact.address ?? "").split(",").map((line, i) => (
                  <p key={i}>{line.trim()}</p>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-white">{site.officeHoursHeading || "Office Hours"}</h3>
              <div className="mt-4 space-y-3 text-sm text-white/60">
                {(contact.hours ?? []).map((h) => (
                  <div key={h.day} className="flex justify-between border-b border-white/20 pb-2 last:border-b-0">
                    <span>{h.day}</span>
                    <span>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
