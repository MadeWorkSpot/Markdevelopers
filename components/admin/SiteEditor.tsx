"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveContent } from "@/actions";
import { toast } from "./Toaster";

type SiteData = {
  navbarMenuLabel: string;
  navLinkLabels: string[];
  footerTagline: string;
  footerQuickLinksHeading: string;
  footerQuickLinkLabels: string[];
  footerContactHeading: string;
  footerCopyright: string;
  learnMoreLabel: string;
  viewAllServicesLabel: string;
  sendMessageLabel: string;
  contactDetailsHeading: string;
  officeHoursHeading: string;
  servicesSectionHeading: string;
  projectsSectionHeading: string;
  viewAllProjectsLabel: string;
  contactNameLabel: string;
  contactNamePlaceholder: string;
  contactEmailLabel: string;
  contactEmailPlaceholder: string;
  contactMessageLabel: string;
  contactMessagePlaceholder: string;
};

export default function SiteEditor({ data: initial }: { data: SiteData }) {
  const router = useRouter();
  const [data, setData] = useState({
    navbarMenuLabel: initial.navbarMenuLabel ?? "",
    navLinkLabels: initial.navLinkLabels ?? [],
    footerTagline: initial.footerTagline ?? "",
    footerQuickLinksHeading: initial.footerQuickLinksHeading ?? "",
    footerQuickLinkLabels: initial.footerQuickLinkLabels ?? [],
    footerContactHeading: initial.footerContactHeading ?? "",
    footerCopyright: initial.footerCopyright ?? "",
    learnMoreLabel: initial.learnMoreLabel ?? "",
    viewAllServicesLabel: initial.viewAllServicesLabel ?? "",
    sendMessageLabel: initial.sendMessageLabel ?? "",
    contactDetailsHeading: initial.contactDetailsHeading ?? "",
    officeHoursHeading: initial.officeHoursHeading ?? "",
    servicesSectionHeading: initial.servicesSectionHeading ?? "",
    projectsSectionHeading: initial.projectsSectionHeading ?? "",
    viewAllProjectsLabel: initial.viewAllProjectsLabel ?? "",
    contactNameLabel: initial.contactNameLabel ?? "",
    contactNamePlaceholder: initial.contactNamePlaceholder ?? "",
    contactEmailLabel: initial.contactEmailLabel ?? "",
    contactEmailPlaceholder: initial.contactEmailPlaceholder ?? "",
    contactMessageLabel: initial.contactMessageLabel ?? "",
    contactMessagePlaceholder: initial.contactMessagePlaceholder ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("site", data);
      toast.success("Saved");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-medium text-white sm:text-2xl">Site Text</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <Section title="Navbar">
        <Field label="Menu Label">
          <input value={data.navbarMenuLabel} onChange={(e) => setData((d) => ({ ...d, navbarMenuLabel: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Nav Link Labels (comma-separated)" span>
          <input value={(data.navLinkLabels ?? []).join(", ")} onChange={(e) => setData((d) => ({ ...d, navLinkLabels: e.target.value.split(",").map((s) => s.trim()) }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>

      <Section title="Footer">
        <Field label="Tagline" span>
          <textarea value={data.footerTagline} onChange={(e) => setData((d) => ({ ...d, footerTagline: e.target.value }))} rows={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Quick Links Heading">
          <input value={data.footerQuickLinksHeading} onChange={(e) => setData((d) => ({ ...d, footerQuickLinksHeading: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Quick Link Labels (comma-separated)" span>
          <input value={(data.footerQuickLinkLabels ?? []).join(", ")} onChange={(e) => setData((d) => ({ ...d, footerQuickLinkLabels: e.target.value.split(",").map((s) => s.trim()) }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Contact Heading">
          <input value={data.footerContactHeading} onChange={(e) => setData((d) => ({ ...d, footerContactHeading: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Copyright">
          <input value={data.footerCopyright} onChange={(e) => setData((d) => ({ ...d, footerCopyright: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>

      <Section title="Homepage Sections">
        <Field label="Services Section Heading">
          <input value={data.servicesSectionHeading} onChange={(e) => setData((d) => ({ ...d, servicesSectionHeading: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Projects Section Heading">
          <input value={data.projectsSectionHeading} onChange={(e) => setData((d) => ({ ...d, projectsSectionHeading: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>

      <Section title="Contact Form Labels">
        <Field label="Name Label">
          <input value={data.contactNameLabel} onChange={(e) => setData((d) => ({ ...d, contactNameLabel: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Name Placeholder">
          <input value={data.contactNamePlaceholder} onChange={(e) => setData((d) => ({ ...d, contactNamePlaceholder: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Email Label">
          <input value={data.contactEmailLabel} onChange={(e) => setData((d) => ({ ...d, contactEmailLabel: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Email Placeholder">
          <input value={data.contactEmailPlaceholder} onChange={(e) => setData((d) => ({ ...d, contactEmailPlaceholder: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Message Label">
          <input value={data.contactMessageLabel} onChange={(e) => setData((d) => ({ ...d, contactMessageLabel: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Message Placeholder" span>
          <input value={data.contactMessagePlaceholder} onChange={(e) => setData((d) => ({ ...d, contactMessagePlaceholder: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>

      <Section title="Button & Label Text">
        <Field label="Learn More">
          <input value={data.learnMoreLabel} onChange={(e) => setData((d) => ({ ...d, learnMoreLabel: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="View All Services">
          <input value={data.viewAllServicesLabel} onChange={(e) => setData((d) => ({ ...d, viewAllServicesLabel: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="View All Projects">
          <input value={data.viewAllProjectsLabel} onChange={(e) => setData((d) => ({ ...d, viewAllProjectsLabel: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Send Message">
          <input value={data.sendMessageLabel} onChange={(e) => setData((d) => ({ ...d, sendMessageLabel: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Contact Details Heading">
          <input value={data.contactDetailsHeading} onChange={(e) => setData((d) => ({ ...d, contactDetailsHeading: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Office Hours Heading">
          <input value={data.officeHoursHeading} onChange={(e) => setData((d) => ({ ...d, officeHoursHeading: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, span, children }: { label: string; span?: boolean; children: React.ReactNode }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
