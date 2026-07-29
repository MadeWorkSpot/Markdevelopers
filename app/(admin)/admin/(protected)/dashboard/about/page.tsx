import AboutEditor from "@/components/admin/AboutEditor";
import { readData } from "@/lib/data";

export default async function AboutPage() {
  const data = await readData<Record<string, unknown>>("about");
  return <AboutEditor key={JSON.stringify(data)} data={data as never} />;
}
