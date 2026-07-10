import ContentManager from "@/components/admin/ContentManager";
import { readData } from "@/lib/data";
import { addArrayItem, updateArrayItem, deleteArrayItem, reorderArray } from "@/actions";

export default async function ServicesPage() {
  const data = await readData<{ services: Record<string, unknown>[] }>("services");
  return (
    <ContentManager
      title="Services"
      items={data.services ?? []}
      fields={[
        { key: "title", label: "Title", type: "text" },
        { key: "desc", label: "Description", type: "textarea" },
        { key: "image", label: "Image URL", type: "image" },
      ]}
        onSave={updateArrayItem.bind(null, "services", "services")}
        onAdd={addArrayItem.bind(null, "services", "services")}
        onDelete={deleteArrayItem.bind(null, "services", "services")}
        onReorder={reorderArray.bind(null, "services", "services")}
    />
  );
}
