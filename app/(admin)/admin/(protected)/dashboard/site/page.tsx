import SiteEditor from "@/components/admin/SiteEditor";
import { readData } from "@/lib/data";

export default async function SitePage() {
  const data = await readData<Record<string, unknown>>("site");
  return <SiteEditor key={JSON.stringify(data)} data={data as never} />;
}
