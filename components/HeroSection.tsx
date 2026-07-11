import ImageCarousel, { type Slide } from "@/components/ImageCarousel";
import { readData } from "@/lib/data";

export default async function HeroSection() {
  const data = await readData<{ slides: Slide[] }>("carousel");
  if (!data.slides || data.slides.length === 0) return null;
  return (
    <section className="relative h-dvh w-full overflow-hidden">
      <ImageCarousel slides={data.slides} />
    </section>
  );
}
