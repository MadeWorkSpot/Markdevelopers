"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveContent } from "@/actions";
import { toast } from "./Toaster";

type FieldConfig = { key: string; label: string; type?: "text" | "textarea" };

export default function PageTextEditor({
  title,
  fields,
  data,
  fileName,
}: {
  title: string;
  fields: FieldConfig[];
  data: Record<string, unknown>;
  fileName: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.key] = String(data[f.key] ?? ""); });
    return init;
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveContent(fileName, form);
      toast.success("Saved");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">{title}</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <label className="mb-1 block text-xs font-medium text-zinc-500">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-500"
              />
            ) : (
              <input
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
