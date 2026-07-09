import ContactEditor from "@/components/admin/ContactEditor";
import { readData } from "@/lib/data";

export default async function ContactPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await readData<any>("contact");
  return <ContactEditor data={data} />;
}
