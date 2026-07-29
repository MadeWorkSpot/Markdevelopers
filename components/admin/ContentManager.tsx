"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";
import { toast } from "./Toaster";
import { useConfirm } from "./ConfirmDialog";

export type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "video" | "url" | "select";
  options?: string[];
  dependsOn?: { key: string; value: string };
};

export default function ContentManager({
  title,
  items,
  fields,
  onSave,
  onAdd,
  onDelete,
  onReorder,
}: {
  title: string;
  items: Record<string, unknown>[];
  fields: Field[];
  onSave: (index: number, data: Record<string, unknown>) => Promise<{ success: boolean }>;
  onAdd: (data: Record<string, unknown>) => Promise<{ success: boolean }>;
  onDelete: (index: number) => Promise<{ success: boolean }>;
  onReorder?: (fromIndex: number, toIndex: number) => Promise<{ success: boolean }>;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const resetForm = useCallback(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.key] = ""; });
    const typeField = fields.find((f) => f.type === "select" && f.options?.length);
    if (typeField?.options) init[typeField.key] = typeField.options[0];
    setForm(init);
  }, [fields]);

  function startEdit(item: Record<string, unknown>, index: number) {
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      const val = item[f.key];
      init[f.key] = val != null ? String(val) : "";
    });
    const typeField = fields.find((f) => f.type === "select" && f.options?.length);
    if (typeField?.options && !init[typeField.key]) {
      init[typeField.key] = item.videoSrc ? "video" : typeField.options[0];
    }
    setForm(init);
    setEditingIndex(index);
    setAdding(false);
  }

  function startAdd() {
    resetForm();
    setAdding(true);
    setEditingIndex(null);
  }

  function cancel() {
    setEditingIndex(null);
    setAdding(false);
  }

  function isValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function visibleFields() {
    return fields.filter((f) => !f.dependsOn || form[f.dependsOn.key] === f.dependsOn.value);
  }

  async function handleSave() {
    const requiredFields = visibleFields().filter((f) => f.type === "text" || f.type === "textarea" || f.type === "url" || f.type === "image" || f.type === "video");
    const emptyField = requiredFields.find((f) => !(form[f.key] ?? "").trim());
    if (emptyField) {
      toast.error(`${emptyField.label} is required`);
      return;
    }
    const urlFields = visibleFields().filter((f) => f.type === "url" || f.type === "image" || f.type === "video");
    const invalidUrl = urlFields.find((f) => (form[f.key] ?? "").trim() && !isValidUrl(form[f.key]));
    if (invalidUrl) {
      toast.error(`${invalidUrl.label} must be a valid http or https URL`);
      return;
    }
    setSaving(true);
    try {
      if (adding) {
        await onAdd({ ...form });
      } else if (editingIndex !== null) {
        await onSave(editingIndex, { ...form });
      }
      toast.success("Saved");
      cancel();
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(index: number) {
    const ok = await confirm("Delete this item?");
    if (!ok) return;
    try {
      await onDelete(index);
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  function handleImageUpload(url: string, key: string) {
    setForm((prev) => ({ ...prev, [key]: url }));
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  }

  function handleDragEnter(e: React.DragEvent, index: number) {
    e.preventDefault();
    dragCounter.current++;
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  }

  async function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    dragCounter.current = 0;
    const fromIndex = dragIndex;
    setDragIndex(null);
    setDragOverIndex(null);
    if (fromIndex === null || fromIndex === toIndex || !onReorder) return;
    try {
      await onReorder(fromIndex, toIndex);
      toast.success("Reordered");
      router.refresh();
    } catch {
      toast.error("Failed to reorder");
    }
  }

  function handleDragEnd() {
    dragCounter.current = 0;
    setDragIndex(null);
    setDragOverIndex(null);
  }

  const showForm = editingIndex !== null || adding;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium text-white sm:text-2xl">{title}</h1>
        {!showForm && (
          <button
            onClick={startAdd}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Add New
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 rounded-xl border border-zinc-700 bg-zinc-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">
            {adding ? "Add New" : "Edit"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleFields().map((field) => (
              <div key={field.key} className={field.type === "textarea" || field.type === "image" || field.type === "video" || field.type === "select" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  {field.label}
                </label>
                {field.type === "select" && field.options ? (
                  <div className="flex gap-2">
                    {field.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setForm((p) => {
                            const next = { ...p, [field.key]: opt };
                            fields.forEach((f) => {
                              if (f.dependsOn && f.dependsOn.key === field.key && f.dependsOn.value !== opt) {
                                next[f.key] = "";
                              }
                            });
                            return next;
                          });
                        }}
                        className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-colors ${
                          form[field.key] === opt
                            ? "border-white bg-white text-black"
                            : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={form[field.key] ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-500"
                  />
                ) : field.type === "image" ? (
                  <div className="space-y-2">
                    <input
                      value={form[field.key] ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder="Image URL"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-500"
                    />
                    <ImageUploader
                      onUpload={(url) => handleImageUpload(url, field.key)}
                      onUploadingChange={(u) => setUploadingCount((c) => c + (u ? 1 : -1))}
                    />
                    {form[field.key] && (
                      <img
                        src={form[field.key]}
                        alt="Preview"
                        className="mt-2 h-24 w-40 rounded-lg object-cover max-w-full"
                      />
                    )}
                  </div>
                ) : field.type === "video" ? (
                  <div className="space-y-2">
                    <input
                      value={form[field.key] ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder="Video URL"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-500"
                    />
                    <ImageUploader
                      accept="video/*"
                      buttonLabel="Upload Video"
                      onUpload={(url) => handleImageUpload(url, field.key)}
                      onUploadingChange={(u) => setUploadingCount((c) => c + (u ? 1 : -1))}
                    />
                    {form[field.key] && (
                      <video
                        src={form[field.key]}
                        className="mt-2 h-24 w-40 rounded-lg object-cover max-w-full"
                        controls
                      />
                    )}
                  </div>
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
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || uploadingCount > 0}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {uploadingCount > 0 ? "Uploading..." : saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancel}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, i) => {
          const record = item as Record<string, string | undefined>;
          const imageUrl = record.src || null;
          const videoUrl = record.videoSrc || null;
          const preview = `Item ${i + 1}`;

          return (
            <div key={i}
              draggable={!!onReorder}
              onDragStart={(e) => handleDragStart(e, i)}
              onDragEnter={(e) => handleDragEnter(e, i)}
              onDragLeave={handleDragLeave}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex flex-wrap items-center gap-3 rounded-xl border bg-zinc-900/50 p-3 transition-all sm:gap-4 sm:p-4 ${
                dragOverIndex === i
                  ? "border-zinc-500 scale-[1.01]"
                  : dragIndex === i
                    ? "border-zinc-600 opacity-50"
                    : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {onReorder && (
                <div className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing" title="Drag to reorder">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-zinc-600">
                    <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                  </svg>
                </div>
              )}
              {videoUrl ? (
                <video
                  src={videoUrl}
                  className="h-14 w-20 flex-shrink-0 rounded-lg object-cover max-w-full"
                />
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="h-14 w-20 flex-shrink-0 rounded-lg object-cover max-w-full"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{preview}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => startEdit(item, i)}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(i)}
                  className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-950/50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-600">No items yet.</p>
        )}
      </div>
    </div>
  );
}
