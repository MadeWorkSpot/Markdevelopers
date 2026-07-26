import Link from "next/link";
import type { Metadata } from "next";
import { readData } from "@/lib/data";

export const revalidate = 60;

type AboutData = {
  hero: { image: string; alt: string; heading: string; description: string };
  companyStory: { heading: string; content: string };
  sectionLabels: {
    aboutUs: string;
    ourTeam: string;
    teamHeading: string;
    letsWorkTogether: string;
    readyToStartHeading: string;
    readyToStartDesc: string;
    getInTouchLabel: string;
  };
  ceoMessage: { image: string; alt: string; name: string; title: string; message: string };
  values: { title: string; desc: string }[];
  team: { name: string; role: string; image: string }[];
};

export async function generateMetadata(): Promise<Metadata> {
  const about = await readData<AboutData>("about");

  const heroDesc = about.hero?.description ?? "";
  const companyStory = about.companyStory?.content ?? "";
  const description = heroDesc || companyStory.slice(0, 160) || "Learn about Mark Developers — our mission, values, and team of construction and design professionals.";

  return {
    title: "About Us",
    description,
    keywords: [
      "about Mark Developers",
      "construction company team",
      "our mission",
      "building contractors India",
      "construction values",
      "architectural design team",
    ],
    openGraph: {
      title: "About Us | Mark Developers",
      description,
      url: "https://markdevelopers.in/about",
      siteName: "Mark Developers",
      type: "website",
      locale: "en_IN",
      ...(about.hero?.image && {
        images: [
          {
            url: about.hero.image,
            width: 1200,
            height: 630,
            alt: about.hero.alt || "About Mark Developers",
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: "About Us | Mark Developers",
      description,
      ...(about.hero?.image && { images: [about.hero.image] }),
    },
    alternates: {
      canonical: "https://markdevelopers.in/about",
    },
  };
}

export default async function AboutPage() {
  const about = await readData<AboutData>("about");

  const labels = about.sectionLabels ?? {};

  return (
    <div className="overflow-x-hidden">
      <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-black">
        <div className="absolute inset-0">
          {about.hero?.image && (
            <img
              src={about.hero.image}
              alt={about.hero.alt}
              className="h-full w-full object-cover opacity-60"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        <div className="relative z-10 px-4 md:px-8 lg:px-12 xl:px-24">
          <h1 className="mt-4 max-w-4xl text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-white text-balance">
            {(about.hero?.heading ?? "").split("&").map((part, i) =>
              i === 0 ? (
                part.trim() + " "
              ) : (
                <span key={i} className="block font-medium">
                  {"& " + part.trim()}
                </span>
              )
            )}
          </h1>
          <p className="mt-3 md:mt-6 max-w-3xl text-md sm:text-lg md:text-xl leading-snug text-white/60">
            {about.hero?.description ?? ""}
          </p>
        </div>
      </section>

      {about.companyStory?.content && (
        <section className="bg-white px-4 py-16 md:px-8 lg:px-12 xl:px-24">
          <div className="mx-auto max-w-full">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-normal leading-tight text-black text-balance">
              {about.companyStory?.heading}
            </h2>
            <div className="mt-4 md:mt-6 max-w-full leading-snug text-black/60 xs:text-md md:text-lg whitespace-pre-line">
              {about.companyStory.content}
            </div>
          </div>
        </section>
      )}

      {about.ceoMessage?.message && (
        <section className="bg-white px-4 pb-16 md:px-8 lg:px-12 xl:px-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center gap-8 md:flex-row md:gap-16">
              {about.ceoMessage.image && (
                <div className="shrink-0">
                  <img
                    src={about.ceoMessage.image}
                    alt={about.ceoMessage.alt || about.ceoMessage.name}
                    className="h-48 w-48 rounded-full object-cover md:h-64 md:w-64"
                  />
                  <div className="mt-4 text-center md:hidden">
                    <h3 className="text-lg font-medium text-black">{about.ceoMessage.name}</h3>
                    <p className="text-sm text-black/50">{about.ceoMessage.title}</p>
                  </div>
                </div>
              )}
              <div className="flex-1 text-center md:text-left">
                <svg className="mx-auto hidden md:flex mb-4 h-10 w-10 text-black/15 md:mx-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="xs:text-md md:text-lg leading-snug text-black/60">
                  {about.ceoMessage.message}
                </p>
                <div className="mt-6 hidden md:block">
                  <h3 className="text-lg font-medium text-black">{about.ceoMessage.name}</h3>
                  <p className="text-sm text-black/50">{about.ceoMessage.title}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-black px-4 py-16 md:px-8 lg:px-12 xl:px-24">
        <div className="mx-auto max-w-full">
          <div className="grid gap-8 lg:grid-cols-2">
            {(about.values ?? []).map((v) => (
              <div key={v.title}>
                <span className="text-md md:text-lg font-medium uppercase text-white/50">
                  {v.title}
                </span>
                <p className="mt-2 text-white/60 xs:text-md md:text-lg leading-snug">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 md:px-8 lg:px-12 xl:px-24">
        <div className="mx-auto max-w-full">
          <h2 className="mt-4 text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-black text-balance">
            {(labels.teamHeading ?? "").split(" ").map((word, i, arr) =>
              i === arr.length - 1 ? (
                <span key={i} className="font-medium">{word}</span>
              ) : (
                word + " "
              )
            )}
          </h2>
          <div className="mt-4 md:mt-8 flex flex-wrap gap-4 sm:gap-8">
            {(about.team ?? []).map((m) => (
              <div key={m.name} className="group cursor-pointer w-[calc(50%-8px)] sm:w-[calc(50%-16px)] lg:w-[calc(20%-26px)]">
                <div className="aspect-[3/4] w-full overflow-hidden">
                  {m.image && (
                    <img
                      src={m.image}
                      alt={m.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  )}
                </div>
                <div className="mt-2 md:mt-4">
                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-black">{m.name}</h3>
                  <p className=" text-sm text-black/60">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black px-4 py-16 md:px-8 lg:px-12 xl:px-24">
        <div className="mx-auto max-w-full">
          <h2 className="mt-4 text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-white text-balance">
            {(labels.readyToStartHeading ?? "").split(" ").map((word, i, arr) =>
              i === arr.length - 1 ? (
                <span key={i} className="block font-medium">{word}</span>
              ) : (
                word + " "
              )
            )}
          </h2>
          <p className="mt-6 max-w-2xl leading-snug text-white/60 sm:text-lg">
            {labels.readyToStartDesc}
          </p>
          <Link
            href="/#contact"
            className="mt-4 md:mt-8 inline-flex items-center gap-2 rounded-full border border-white px-6 py-3 text-xs md:text-sm font-medium uppercase tracking-wide text-white transition-all hover:bg-white hover:text-black"
          >
            {labels.getInTouchLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
