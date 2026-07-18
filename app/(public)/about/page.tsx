import Link from "next/link";
import { readData } from "@/lib/data";

export const revalidate = 60;

export const metadata = {
  title: "About | Mark Developers",
  description: "Learn about Mark Developers — our mission, values, and team.",
};

export default async function AboutPage() {
  const about = await readData<{
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
    values: { title: string; desc: string }[];
    team: { name: string; role: string; image: string }[];
  }>("about");

  const labels = about.sectionLabels ?? {};

  return (
    <>
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

      <section className="bg-black px-4 py-16 md:px-8 lg:px-12 xl:px-24">
        <div className="mx-auto max-w-full">
          <div className="grid gap-16 lg:grid-cols-2">
            {(about.values ?? []).map((v) => (
              <div key={v.title}>
                <span className="text-md md:text-lg font-medium uppercase text-white/50">
                  {v.title}
                </span>
                <p className="mt-4 leading-tight text-white/60 xs:text-2x md:text-md">{v.desc}</p>
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
          <div className="mt-4 md:mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {(about.team ?? []).map((m) => (
              <div key={m.name} className="group cursor-pointer">
                <div className="aspect-[3/4] overflow-hidden">
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
    </>
  );
}
