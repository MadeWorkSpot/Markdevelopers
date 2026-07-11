"use client";

import { useRef, useState } from "react";
import { toast } from "./Toaster";

export default function ImageUploader({ onUpload, onUploadingChange, id = "image-upload" }: { onUpload: (url: string) => void; onUploadingChange?: (uploading: boolean) => void; id?: string }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/admin/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }
      if (data.url) {
        onUpload(data.url);
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed. Please check your connection.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        id={id}
        disabled={uploading}
      />
      <label
        htmlFor={id}
        className={`rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/50 ${uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </label>
    </div>
  );
}
