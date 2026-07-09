import AboutEditor from "@/components/admin/AboutEditor";
import { readData } from "@/lib/data";

export default async function AboutPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await readData<any>("about");
  return <AboutEditor data={data} />;
}
