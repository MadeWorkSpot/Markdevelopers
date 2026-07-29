import ContactEditor from "@/components/admin/ContactEditor";
import { readData } from "@/lib/data";

export default async function ContactPage() {
  const data = await readData<Record<string, unknown>>("contact");
  return <ContactEditor key={JSON.stringify(data)} data={data as never} />;
}
