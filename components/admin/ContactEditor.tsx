"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveContent } from "@/actions";
import { toast } from "./Toaster";

type ContactData = {
  email: string;
  phone: string;
  address: string;
  heading: string;
  description: string;
  hours: { day: string; time: string }[];
};

export default function ContactEditor({ data: initial }: { data: ContactData }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent("contact", data);
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
        <h1 className="text-2xl font-medium text-white">Contact Info</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <Section title="Section Text">
        <Field label="Heading">
          <input value={data.heading} onChange={(e) => setData((d) => ({ ...d, heading: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Description" span>
          <textarea value={data.description} onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))} rows={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>

      <Section title="Contact Details">
        <Field label="Email">
          <input value={data.email} onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Phone">
          <input value={data.phone} onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
        <Field label="Address" span>
          <input value={data.address} onChange={(e) => setData((d) => ({ ...d, address: e.target.value }))} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
        </Field>
      </Section>

      <Section title="Office Hours">
        {(data.hours ?? []).map((h, i) => (
          <div key={i} className="flex gap-3">
            <input value={h.day} onChange={(e) => { const n = [...data.hours]; n[i] = { ...n[i], day: e.target.value }; setData((d) => ({ ...d, hours: n })); }} placeholder="Day" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <input value={h.time} onChange={(e) => { const n = [...data.hours]; n[i] = { ...n[i], time: e.target.value }; setData((d) => ({ ...d, hours: n })); }} placeholder="Time" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            <button onClick={() => setData((d) => ({ ...d, hours: d.hours.filter((_, j) => j !== i) }))} className="rounded-lg border border-red-900/50 px-3 py-2 text-xs text-red-400 hover:bg-red-950/50">Remove</button>
          </div>
        ))}
        <button onClick={() => setData((d) => ({ ...d, hours: [...d.hours, { day: "", time: "" }] }))} className="mt-3 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Add Hours</button>
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
