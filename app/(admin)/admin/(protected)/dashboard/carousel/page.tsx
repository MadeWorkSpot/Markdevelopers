import ContentManager from "@/components/admin/ContentManager";
import { readData } from "@/lib/data";
import { addArrayItem, updateArrayItem, deleteArrayItem, reorderArray } from "@/actions";

export default async function CarouselPage() {
  const data = await readData<{ slides: Record<string, unknown>[] }>("carousel");
  return (
    <ContentManager
      title="Carousel Slides"
      items={data.slides ?? []}
      fields={[
        { key: "src", label: "Image URL", type: "image" },
        { key: "alt", label: "Alt Text", type: "text" },
        { key: "subtitle", label: "Subtitle", type: "textarea" },
        { key: "href", label: "Link URL", type: "url" },
        { key: "label", label: "Button Label", type: "text" },
      ]}
      onSave={updateArrayItem.bind(null, "carousel", "slides")}
      onAdd={addArrayItem.bind(null, "carousel", "slides")}
      onDelete={deleteArrayItem.bind(null, "carousel", "slides")}
      onReorder={reorderArray.bind(null, "carousel", "slides")}
    />
  );
}
