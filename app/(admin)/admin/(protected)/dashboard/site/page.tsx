import SiteEditor from "@/components/admin/SiteEditor";
import { readData } from "@/lib/data";

export default async function SitePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await readData<any>("site");
  return <SiteEditor key={JSON.stringify(data)} data={data} />;
}
