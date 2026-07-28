import type { Metadata } from "next";
import { readData } from "@/lib/data";

export const revalidate = 60;

function isVideoUrl(url: string) {
  return /\/video\/upload\//.test(url) || /\.(webm|mp4|ogg)(\?|$)/i.test(url);
}

type GalleryData = {
  pageLabel: string;
  pageHeading: string;
  pageSubtitle: string;
  images: { src: string; alt: string }[];
};

function firstImage(items: { src: string; alt: string }[]) {
  return items.find((i) => !isVideoUrl(i.src));
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await readData<GalleryData>("gallery");

    const pageSubtitle = data.pageSubtitle ?? "";
    const imageCount = (data.images ?? []).length;
    const description = pageSubtitle || `Browse our gallery of ${imageCount}+ premium construction and interior design projects by Mark Developers.`;

    const ogImage = firstImage(data.images ?? []);

    return {
      title: "Gallery",
      description,
      keywords: [
        "construction gallery",
        "interior design photos",
        "building projects gallery",
        "premium construction work",
        "renovation photos",
        "Mark Developers gallery",
      ],
      openGraph: {
        title: "Gallery | Mark Developers",
        description,
        url: "https://markdevelopers.in/gallery",
        siteName: "Mark Developers",
        type: "website",
        locale: "en_IN",
        ...(ogImage?.src && {
          images: [
            {
              url: ogImage.src,
              width: 1200,
              height: 630,
              alt: ogImage.alt || "Mark Developers Gallery",
            },
          ],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title: "Gallery | Mark Developers",
        description,
        ...(ogImage?.src && { images: [ogImage.src] }),
      },
      alternates: {
        canonical: "https://markdevelopers.in/gallery",
      },
    };
  } catch {
    return {
      title: "Gallery",
      description: "Browse our gallery of premium construction and interior design projects by Mark Developers.",
    };
  }
}

export default async function GalleryPage() {
  const data = await readData<GalleryData>("gallery");

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
          {(data.images ?? []).map((item, i) => (
            <div key={i} className="group mb-6 break-inside-avoid overflow-hidden">
              {item.src && isVideoUrl(item.src) ? (
                <video
                  src={item.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                item.src && (
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
