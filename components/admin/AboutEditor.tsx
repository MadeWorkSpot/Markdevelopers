"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUploader from "@/components/admin/ImageUploader";
import { saveContent } from "@/actions";
import { toast } from "./Toaster";

type AboutData = {
  hero: {
    image: string;
    alt: string;
    heading: string;
    description: string;
  };
  companyStory: {
    heading: string;
    content: string;
  };
  stats: { number: string; label: string }[];
  sectionLabels: {
    aboutUs: string;
    ourTeam: string;
    teamHeading: string;
    letsWorkTogether: string;
    readyToStartHeading: string;
    readyToStartDesc: string;
    getInTouchLabel: string;
  };
  values: { title: string; desc: string }[];
  team: { name: string; role: string; image: string }[];
};

export default function AboutPage({ data: initial }: { data: AboutData }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("about", data);
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
        <h1 className="text-xl font-medium text-white sm:text-2xl">About Page</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <Section title="Hero Section">
        <Field label="Image URL">
          <div className="space-y-2">
            <input
              value={data.hero.image}
              onChange={(e) => setData((d) => ({ ...d, hero: { ...d.hero, image: e.target.value } }))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
            />
            <ImageUploader onUpload={(url) => setData((d) => ({ ...d, hero: { ...d.hero, image: url } }))} />
            {data.hero.image && <img src={data.hero.image} alt="" className="h-24 w-40 rounded-lg object-cover" />}
          </div>
        </Field>
        <Field label="Alt Text">
          <input value={data.hero.alt} onChange={(e) => setData((d) => ({ ...d, hero: { ...d.hero, alt: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Heading">
          <input value={data.hero.heading} onChange={(e) => setData((d) => ({ ...d, hero: { ...d.hero, heading: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Description" span>
          <textarea value={data.hero.description} onChange={(e) => setData((d) => ({ ...d, hero: { ...d.hero, description: e.target.value } }))} rows={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>

      <Section title="Company Story">
        <Field label="Heading">
          <input value={data.companyStory?.heading ?? ""} onChange={(e) => setData((d) => ({ ...d, companyStory: { ...d.companyStory, heading: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Content" span>
          <textarea value={data.companyStory?.content ?? ""} onChange={(e) => setData((d) => ({ ...d, companyStory: { ...d.companyStory, content: e.target.value } }))} rows={6} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>

      <Section title="Stats">
        {(data.stats ?? []).map((s, i) => (
          <div key={i} className="flex gap-3">
            <input value={s.number} onChange={(e) => { const n = [...data.stats]; n[i] = { ...n[i], number: e.target.value }; setData((d) => ({ ...d, stats: n })); }} placeholder="Number" className="w-32 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <input value={s.label} onChange={(e) => { const n = [...data.stats]; n[i] = { ...n[i], label: e.target.value }; setData((d) => ({ ...d, stats: n })); }} placeholder="Label" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <button onClick={() => setData((d) => ({ ...d, stats: d.stats.filter((_, j) => j !== i) }))} className="rounded-lg border border-red-900/50 px-3 py-2 text-xs text-red-400 hover:bg-red-950/50">Remove</button>
          </div>
        ))}
        <button onClick={() => setData((d) => ({ ...d, stats: [...d.stats, { number: "", label: "" }] }))} className="mt-3 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Add Stat</button>
      </Section>

      <Section title="Values">
        {(data.values ?? []).map((v, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-zinc-800 p-4">
            <input value={v.title} onChange={(e) => { const n = [...data.values]; n[i] = { ...n[i], title: e.target.value }; setData((d) => ({ ...d, values: n })); }} placeholder="Title" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <textarea value={v.desc} onChange={(e) => { const n = [...data.values]; n[i] = { ...n[i], desc: e.target.value }; setData((d) => ({ ...d, values: n })); }} rows={2} placeholder="Description" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <button onClick={() => setData((d) => ({ ...d, values: d.values.filter((_, j) => j !== i) }))} className="text-xs text-red-400 hover:text-red-300">Remove</button>
          </div>
        ))}
        <button onClick={() => setData((d) => ({ ...d, values: [...d.values, { title: "", desc: "" }] }))} className="mt-3 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Add Value</button>
      </Section>

      <Section title="Team Members">
        {(data.team ?? []).map((m, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-zinc-800 p-4">
            <div className="flex gap-3">
              <input value={m.name} onChange={(e) => { const n = [...data.team]; n[i] = { ...n[i], name: e.target.value }; setData((d) => ({ ...d, team: n })); }} placeholder="Name" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
              <input value={m.role} onChange={(e) => { const n = [...data.team]; n[i] = { ...n[i], role: e.target.value }; setData((d) => ({ ...d, team: n })); }} placeholder="Role" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            </div>
            <div className="space-y-2">
              <input value={m.image} onChange={(e) => { const n = [...data.team]; n[i] = { ...n[i], image: e.target.value }; setData((d) => ({ ...d, team: n })); }} placeholder="Image URL" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
              <ImageUploader onUpload={(url) => { const n = [...data.team]; n[i] = { ...n[i], image: url }; setData((d) => ({ ...d, team: n })); }} />
              {m.image && <img src={m.image} alt="" className="h-16 w-24 rounded-lg object-cover" />}
            </div>
            <button onClick={() => setData((d) => ({ ...d, team: d.team.filter((_, j) => j !== i) }))} className="text-xs text-red-400 hover:text-red-300">Remove</button>
          </div>
        ))}
        <button onClick={() => setData((d) => ({ ...d, team: [...d.team, { name: "", role: "", image: "" }] }))} className="mt-3 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Add Team Member</button>
      </Section>

      <Section title="Section Labels">
        <Field label="About Us">
          <input value={data.sectionLabels.aboutUs} onChange={(e) => setData((d) => ({ ...d, sectionLabels: { ...d.sectionLabels, aboutUs: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Our Team">
          <input value={data.sectionLabels.ourTeam} onChange={(e) => setData((d) => ({ ...d, sectionLabels: { ...d.sectionLabels, ourTeam: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Team Heading" span>
          <input value={data.sectionLabels.teamHeading} onChange={(e) => setData((d) => ({ ...d, sectionLabels: { ...d.sectionLabels, teamHeading: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Let&apos;s Work Together">
          <input value={data.sectionLabels.letsWorkTogether} onChange={(e) => setData((d) => ({ ...d, sectionLabels: { ...d.sectionLabels, letsWorkTogether: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Ready to Start Heading" span>
          <input value={data.sectionLabels.readyToStartHeading} onChange={(e) => setData((d) => ({ ...d, sectionLabels: { ...d.sectionLabels, readyToStartHeading: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Ready to Start Description" span>
          <textarea value={data.sectionLabels.readyToStartDesc} onChange={(e) => setData((d) => ({ ...d, sectionLabels: { ...d.sectionLabels, readyToStartDesc: e.target.value } }))} rows={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Get in Touch Label">
          <input value={data.sectionLabels.getInTouchLabel} onChange={(e) => setData((d) => ({ ...d, sectionLabels: { ...d.sectionLabels, getInTouchLabel: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
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
