import { readData } from "@/lib/data";

export const revalidate = 60;

export const metadata = {
  title: "Gallery | Mark Developers",
  description: "Browse our project gallery showcasing premium construction and design work.",
};

export default async function GalleryPage() {
  const data = await readData<{
    pageLabel: string;
    pageHeading: string;
    pageSubtitle: string;
    images: { src: string; alt: string }[];
  }>("gallery");

  const headingParts = (data.pageHeading || "Gallery").split(" ");
  const firstWords = headingParts.slice(0, -1).join(" ");
  const lastWord = headingParts[headingParts.length - 1] ?? "";

  return (
    <section className="bg-black px-4 py-16 pt-36 md:px-8 lg:px-12 xl:px-24">
      <div className="mx-auto max-w-full">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-white text-balance">
          {firstWords} {" "}
          <span className="font-medium">{lastWord}</span>
        </h1>
        <p className="mt-4 mt-6 max-w-3xl text-md md:text-lg lg:text-xl leading-snug text-white/60">
          {data.pageSubtitle ?? ""}
        </p>
        <div className="mt-4 md:mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {(data.images ?? []).map((img, i) => (
            <div key={i} className="group mb-6 break-inside-avoid overflow-hidden">
              {img.src && (
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
