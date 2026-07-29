import ContentManager from "@/components/admin/ContentManager";
import PageTextEditor from "@/components/admin/PageTextEditor";
import { readData } from "@/lib/data";
import { addArrayItem, updateArrayItem, deleteArrayItem, reorderArray } from "@/actions";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const data = await readData<{ images: Record<string, unknown>[] }>("gallery");
  return (
    <>
      <PageTextEditor
        title="Page Text"
        fields={[
          { key: "pageLabel", label: "Page Label (badge)" },
          { key: "pageHeading", label: "Page Heading" },
          { key: "pageSubtitle", label: "Page Subtitle", type: "textarea" },
        ]}
        data={data}
        fileName="gallery"
      />
      <ContentManager
        title="Gallery Items"
        items={data.images ?? []}
        fields={[
          { key: "type", label: "Type", type: "select", options: ["image", "video"] },
          { key: "src", label: "Image URL", type: "image", dependsOn: { key: "type", value: "image" } },
          { key: "videoSrc", label: "Video URL", type: "video", dependsOn: { key: "type", value: "video" } },
          { key: "alt", label: "Alt Text", type: "text" },
        ]}
        onSave={updateArrayItem.bind(null, "gallery", "images")}
        onAdd={addArrayItem.bind(null, "gallery", "images")}
        onDelete={deleteArrayItem.bind(null, "gallery", "images")}
        onReorder={reorderArray.bind(null, "gallery", "images")}
      />
    </>
  );
}
