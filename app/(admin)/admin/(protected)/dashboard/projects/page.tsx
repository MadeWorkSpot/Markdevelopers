import ContentManager from "@/components/admin/ContentManager";
import PageTextEditor from "@/components/admin/PageTextEditor";
import { readData } from "@/lib/data";
import { addArrayItem, updateArrayItem, deleteArrayItem } from "@/actions";

export default async function ProjectsPage() {
  const data = await readData<{ projects: Record<string, unknown>[] }>("projects");
  return (
    <>
      <PageTextEditor
        title="Page Text"
        fields={[
          { key: "pageHeading", label: "Page Heading" },
          { key: "pageSubtitle", label: "Page Subtitle", type: "textarea" },
        ]}
        data={data}
        fileName="projects"
      />
      <ContentManager
        title="Projects"
        items={data.projects ?? []}
        fields={[
          { key: "title", label: "Title", type: "text" },
          { key: "location", label: "Location", type: "text" },
          { key: "desc", label: "Description", type: "textarea" },
          { key: "image", label: "Image URL", type: "image" },
        ]}
        onSave={updateArrayItem.bind(null, "projects", "projects")}
        onAdd={addArrayItem.bind(null, "projects", "projects")}
        onDelete={deleteArrayItem.bind(null, "projects", "projects")}
      />
    </>
  );
}
