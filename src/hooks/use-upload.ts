"use client";

import { useState, useCallback } from "react";

interface UseUploadOptions {
  maxSizeMB?: number;
  folder?: string;
}

export function useUpload(options: UseUploadOptions = {}) {
  const { maxSizeMB = 5, folder = "general" } = options;
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState("");

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File terlalu besar. Maksimal ${maxSizeMB}MB`);
        return null;
      }

      setUploading(true);
      setError("");
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Upload gagal");
          return null;
        }
        setUrls((prev) => [...prev, json.data.url]);
        return json.data.url;
      } catch {
        setError("Terjadi kesalahan saat upload");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [maxSizeMB, folder]
  );

  const uploadMultiple = useCallback(
    async (files: FileList | File[]): Promise<string[]> => {
      const results: string[] = [];
      for (const file of Array.from(files)) {
        const url = await upload(file);
        if (url) results.push(url);
      }
      return results;
    },
    [upload]
  );

  const removeUrl = useCallback((index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reset = useCallback(() => {
    setUrls([]);
    setError("");
  }, []);

  return { uploading, urls, error, upload, uploadMultiple, removeUrl, reset, setUrls };
}