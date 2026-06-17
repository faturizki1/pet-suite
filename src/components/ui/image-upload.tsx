"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "./button";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  preview?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  folder?: string;
}

export function ImageUpload({
  onUpload,
  preview,
  multiple,
  maxSizeMB = 5,
  folder = "general",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(preview ? [preview] : []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (res.ok) {
          setPreviews((prev) => [...prev, json.data.url]);
          onUpload(json.data.url);
        }
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePreview(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {previews.map((url, i) => (
          <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
            <img src={url} alt="Preview" className="h-full w-full object-cover" />
            <button
              onClick={() => removePreview(i)}
              className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        loading={uploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload Foto
      </Button>
      <p className="text-xs text-slate-400">Maksimal {maxSizeMB}MB. Format: JPG, PNG, WebP</p>
    </div>
  );
}