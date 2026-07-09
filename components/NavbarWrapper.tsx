import { readData } from "@/lib/data";
import Navbar from "@/components/Navbar";

export default async function NavbarWrapper() {
  const site = await readData<{ navbarMenuLabel: string; navLinkLabels: string[] }>("site");
  const labels = site.navLinkLabels ?? [];
  const links = [
    { href: "/", label: labels[0] || "Home" },
    { href: "/about", label: labels[1] || "About" },
    { href: "/projects", label: labels[2] || "Projects" },
    { href: "/gallery", label: labels[3] || "Gallery" },
    { href: "/#contact", label: labels[4] || "Contact" },
  ];
  return <Navbar menuLabel={site.navbarMenuLabel} links={links} />;
}
