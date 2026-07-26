"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
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
  ceoMessage: { image: string; alt: string; name: string; title: string; message: string };
  values: { title: string; desc: string }[];
  team: { name: string; role: string; image: string }[];
};

export default function AboutPage({ data: initial }: { data: AboutData }) {
  const router = useRouter();
  const [data, setData] = useState<AboutData>(() => ({
    hero: {
      image: initial?.hero?.image ?? "",
      alt: initial?.hero?.alt ?? "",
      heading: initial?.hero?.heading ?? "",
      description: initial?.hero?.description ?? "",
    },
    companyStory: {
      heading: initial?.companyStory?.heading ?? "",
      content: initial?.companyStory?.content ?? "",
    },
    ceoMessage: {
      image: initial?.ceoMessage?.image ?? "",
      alt: initial?.ceoMessage?.alt ?? "",
      name: initial?.ceoMessage?.name ?? "",
      title: initial?.ceoMessage?.title ?? "",
      message: initial?.ceoMessage?.message ?? "",
    },
    stats: initial?.stats ?? [],
    sectionLabels: {
      aboutUs: initial?.sectionLabels?.aboutUs ?? "",
      ourTeam: initial?.sectionLabels?.ourTeam ?? "",
      teamHeading: initial?.sectionLabels?.teamHeading ?? "",
      letsWorkTogether: initial?.sectionLabels?.letsWorkTogether ?? "",
      readyToStartHeading: initial?.sectionLabels?.readyToStartHeading ?? "",
      readyToStartDesc: initial?.sectionLabels?.readyToStartDesc ?? "",
      getInTouchLabel: initial?.sectionLabels?.getInTouchLabel ?? "",
    },
    values: initial?.values ?? [],
    team: initial?.team ?? [],
  }));
  const [saving, setSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  function handleTeamDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  }

  function handleTeamDragEnter(e: React.DragEvent, index: number) {
    e.preventDefault();
    dragCounter.current++;
    setDragOverIndex(index);
  }

  function handleTeamDragLeave() {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  }

  function handleTeamDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    dragCounter.current = 0;
    const fromIndex = dragIndex;
    setDragIndex(null);
    setDragOverIndex(null);
    if (fromIndex === null || fromIndex === toIndex) return;
    setData((d) => {
      const team = [...d.team];
      const [moved] = team.splice(fromIndex, 1);
      team.splice(toIndex, 0, moved);
      return { ...d, team };
    });
  }

  function handleTeamDragEnd() {
    dragCounter.current = 0;
    setDragIndex(null);
    setDragOverIndex(null);
  }

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium text-white sm:text-2xl">About Page</h1>
        <button
          onClick={handleSave}
          disabled={saving || uploadingCount > 0}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {uploadingCount > 0 ? "Uploading..." : saving ? "Saving..." : "Save Changes"}
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
            <ImageUploader id="about-hero-image" onUpload={(url) => setData((d) => ({ ...d, hero: { ...d.hero, image: url } }))} onUploadingChange={(u) => setUploadingCount((c) => c + (u ? 1 : -1))} />
            {data.hero.image && <img src={data.hero.image} alt="" className="h-24 w-40 rounded-lg object-cover max-w-full" />}
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

      <Section title="CEO Message">
        <Field label="Photo">
          <div className="space-y-2">
            <input
              value={data.ceoMessage.image}
              onChange={(e) => setData((d) => ({ ...d, ceoMessage: { ...d.ceoMessage, image: e.target.value } }))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
            />
            <ImageUploader id="about-ceo-image" onUpload={(url) => setData((d) => ({ ...d, ceoMessage: { ...d.ceoMessage, image: url } }))} onUploadingChange={(u) => setUploadingCount((c) => c + (u ? 1 : -1))} />
            {data.ceoMessage.image && <img src={data.ceoMessage.image} alt="" className="h-24 w-24 rounded-full object-cover max-w-full" />}
          </div>
        </Field>
        <Field label="Alt Text">
          <input value={data.ceoMessage.alt} onChange={(e) => setData((d) => ({ ...d, ceoMessage: { ...d.ceoMessage, alt: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Name">
          <input value={data.ceoMessage.name} onChange={(e) => setData((d) => ({ ...d, ceoMessage: { ...d.ceoMessage, name: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Title / Designation">
          <input value={data.ceoMessage.title} onChange={(e) => setData((d) => ({ ...d, ceoMessage: { ...d.ceoMessage, title: e.target.value } }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Message" span>
          <textarea value={data.ceoMessage.message} onChange={(e) => setData((d) => ({ ...d, ceoMessage: { ...d.ceoMessage, message: e.target.value } }))} rows={4} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>

      <Section title="Stats">
        {(data.stats ?? []).map((s, i) => (
          <div key={i} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input value={s.number} onChange={(e) => { const val = e.target.value; setData((d) => { const n = [...d.stats]; n[i] = { ...n[i], number: val }; return { ...d, stats: n }; }); }} placeholder="Number" className="w-full sm:w-32 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <input value={s.label} onChange={(e) => { const val = e.target.value; setData((d) => { const n = [...d.stats]; n[i] = { ...n[i], label: val }; return { ...d, stats: n }; }); }} placeholder="Label" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <button onClick={() => setData((d) => ({ ...d, stats: d.stats.filter((_, j) => j !== i) }))} className="rounded-lg border border-red-900/50 px-3 py-2 text-xs text-red-400 hover:bg-red-950/50">Remove</button>
          </div>
        ))}
        <button onClick={() => setData((d) => ({ ...d, stats: [...d.stats, { number: "", label: "" }] }))} className="mt-3 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Add Stat</button>
      </Section>

      <Section title="Values">
        {(data.values ?? []).map((v, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-zinc-800 p-4">
            <input value={v.title} onChange={(e) => { const val = e.target.value; setData((d) => { const n = [...d.values]; n[i] = { ...n[i], title: val }; return { ...d, values: n }; }); }} placeholder="Title" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <textarea value={v.desc} onChange={(e) => { const val = e.target.value; setData((d) => { const n = [...d.values]; n[i] = { ...n[i], desc: val }; return { ...d, values: n }; }); }} rows={2} placeholder="Description" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <button onClick={() => setData((d) => ({ ...d, values: d.values.filter((_, j) => j !== i) }))} className="text-xs text-red-400 hover:text-red-300">Remove</button>
          </div>
        ))}
        <button onClick={() => setData((d) => ({ ...d, values: [...d.values, { title: "", desc: "" }] }))} className="mt-3 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Add Value</button>
      </Section>

      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-400">Team Members</h2>
        <p className="mb-4 text-xs text-zinc-600">Drag the grip handle to reorder team members.</p>
        <div className="space-y-3">
          {(data.team ?? []).map((m, i) => (
            <div
              key={i}
              draggable
              onDragStart={(e) => handleTeamDragStart(e, i)}
              onDragEnter={(e) => handleTeamDragEnter(e, i)}
              onDragLeave={handleTeamDragLeave}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleTeamDrop(e, i)}
              onDragEnd={handleTeamDragEnd}
              className={`space-y-2 rounded-lg border p-4 transition-all ${
                dragOverIndex === i
                  ? "border-zinc-500 bg-zinc-800/50"
                  : dragIndex === i
                    ? "border-zinc-600 opacity-50"
                    : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing" title="Drag to reorder">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-zinc-600">
                    <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                  </svg>
                </div>
                <input value={m.name} onChange={(e) => { const val = e.target.value; setData((d) => { const n = [...d.team]; n[i] = { ...n[i], name: val }; return { ...d, team: n }; }); }} placeholder="Name" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
                <input value={m.role} onChange={(e) => { const val = e.target.value; setData((d) => { const n = [...d.team]; n[i] = { ...n[i], role: val }; return { ...d, team: n }; }); }} placeholder="Role" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
                <button onClick={() => setData((d) => ({ ...d, team: d.team.filter((_, j) => j !== i) }))} className="rounded-lg border border-red-900/50 px-3 py-2 text-xs text-red-400 hover:bg-red-950/50">Remove</button>
              </div>
              <div className="flex items-center gap-3 pl-8">
                <input value={m.image} onChange={(e) => { const val = e.target.value; setData((d) => { const n = [...d.team]; n[i] = { ...n[i], image: val }; return { ...d, team: n }; }); }} placeholder="Image URL" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
                <ImageUploader id={`about-team-image-${i}`} onUpload={(url) => { setData((d) => { const n = [...d.team]; n[i] = { ...n[i], image: url }; return { ...d, team: n }; }); }} onUploadingChange={(u) => setUploadingCount((c) => c + (u ? 1 : -1))} />
                {m.image && <img src={m.image} alt="" className="h-16 w-24 rounded-lg object-cover max-w-full" />}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setData((d) => ({ ...d, team: [...d.team, { name: "", role: "", image: "" }] }))} className="mt-3 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Add Team Member</button>
      </div>

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
