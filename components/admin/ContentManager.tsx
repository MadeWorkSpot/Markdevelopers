"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";
import { toast } from "./Toaster";
import { useConfirm } from "./ConfirmDialog";

export type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "url";
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const resetForm = useCallback(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.key] = ""; });
    setForm(init);
  }, [fields]);

  function startEdit(item: Record<string, unknown>, index: number) {
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.key] = String(item[f.key] ?? ""); });
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

  async function handleSave() {
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
      <div className="mb-6 flex items-center justify-between">
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
            {fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" || field.type === "image" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
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
                    <ImageUploader onUpload={(url) => handleImageUpload(url, field.key)} />
                    {form[field.key] && (
                      <img
                        src={form[field.key]}
                        alt="Preview"
                        className="mt-2 h-24 w-40 rounded-lg object-cover"
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
              disabled={saving}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
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
          const imageField = fields.find((f) => f.type === "image");
          const imageUrl = imageField ? String(item[imageField.key] ?? "") : null;
          const previewField = fields.find((f) => f.type !== "image");
          const preview = previewField ? String(item[previewField.key] ?? "") : `Item ${i + 1}`;

          return (
            <div
              key={i}
              draggable={!!onReorder}
              onDragStart={(e) => handleDragStart(e, i)}
              onDragEnter={(e) => handleDragEnter(e, i)}
              onDragLeave={handleDragLeave}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-4 rounded-xl border bg-zinc-900/50 p-4 transition-all ${
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
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  className="h-14 w-20 flex-shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{preview}</p>
              </div>
              <div className="flex gap-2">
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
