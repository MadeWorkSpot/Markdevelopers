import Link from "next/link";
import { readData } from "@/lib/data";

export default async function Footer() {
  const site = await readData<{
    footerTagline: string;
    footerQuickLinksHeading: string;
    footerQuickLinkLabels: string[];
    footerContactHeading: string;
    footerCopyright: string;
  }>("site");

  const contact = await readData<{
    email: string;
    phone: string;
    address: string;
  }>("contact");

  const labels = site.footerQuickLinkLabels ?? [];
  const quickLinks = [
    { href: "/", label: labels[0] ?? "Home" },
    { href: "/about", label: labels[1] ?? "About" },
    { href: "/projects", label: labels[2] ?? "Projects" },
    { href: "/gallery", label: labels[3] ?? "Gallery" },
    { href: "/#contact", label: labels[4] ?? "Contact" },
  ];

  return (
    <footer className="bg-black px-4 py-12 text-white md:px-8 lg:px-12 xl:px-24">
      <div className="mx-auto max-w-full">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <img
              src="/markDevelopersLogo.png"
              alt="Mark Developers"
              className="mb-5 h-auto w-[130px] brightness-0 invert"
            />
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              {site.footerTagline}
            </p>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold tracking-wider uppercase text-white/50">{site.footerQuickLinksHeading}</h3>
            <div className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">{link.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold tracking-wider uppercase text-white/50">{site.footerContactHeading}</h3>
            <div className="flex flex-col gap-3 text-sm text-white/60">
              <p>{contact.email}</p>
              <p>{contact.phone}</p>
              {(contact.address ?? "").split(",").map((line, i) => (
                <p key={i}>{line.trim()}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/20 pt-6 text-center text-xs text-white/50">
          &copy; {new Date().getFullYear()} {site.footerCopyright}
        </div>
      </div>
    </footer>
  );
}
