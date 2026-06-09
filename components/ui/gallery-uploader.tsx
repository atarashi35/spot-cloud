"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";
import { isSvgFile } from "@/lib/utils";

export const GALLERY_MAX = 10;

type GalleryUploaderProps = {
  values: string[];
  onChange: (urls: string[]) => void;
  storagePath: string;
  max?: number;
};

async function compressImage(file: File, maxPx = 1200, quality = 0.78): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxPx / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("compression failed")),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });
}

export function GalleryUploader({ values, onChange, storagePath, max = GALLERY_MAX }: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploading = uploadingCount > 0;
  const canAdd = values.length < max;

  async function uploadOne(file: File): Promise<string | null> {
    if (!file.type.startsWith("image/")) return null;
    if (isSvgFile(file)) return null;
    if (file.size > 5 * 1024 * 1024) return null;
    try {
      const compressed = await compressImage(file);
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const storageRef = ref(getFirebaseStorage(), `${storagePath}/${filename}`);
      const task = uploadBytesResumable(storageRef, compressed);
      await new Promise<void>((resolve, reject) => {
        task.on("state_changed", null, reject, resolve);
      });
      return await getDownloadURL(storageRef);
    } catch {
      return null;
    }
  }

  async function handleFiles(files: FileList) {
    const remaining = max - values.length;
    const targets = Array.from(files).slice(0, remaining);
    if (targets.length === 0) return;

    const invalid = targets.filter((f) => !f.type.startsWith("image/") || isSvgFile(f) || f.size > 5 * 1024 * 1024);
    if (invalid.length > 0) {
      setError("一部のファイルはスキップされました（SVG、5MB超、または非対応形式）。");
    } else {
      setError(null);
    }

    setUploadingCount(targets.length);
    setDoneCount(0);

    const urls: string[] = [];
    for (const file of targets) {
      const url = await uploadOne(file);
      if (url) urls.push(url);
      setDoneCount((n) => n + 1);
    }
    setUploadingCount(0);
    setDoneCount(0);
    if (urls.length > 0) onChange([...values, ...urls]);
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {/* サムネイルグリッド */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {values.map((url, i) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-[16px]">
            <img src={url} alt={`ギャラリー ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-sm transition hover:bg-ink/80"
              aria-label="削除"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* 追加ボタン */}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[16px] border-2 border-dashed border-ink/15 bg-mist text-xs text-ink/45 transition hover:border-ink/30 hover:text-ink/65 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{doneCount}/{uploadingCount}</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span>追加</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 枚数表示 */}
      <p className="text-xs text-ink/40">
        {values.length} / {max} 枚
        {!canAdd && <span className="ml-2 font-medium text-ink/55">上限に達しました</span>}
      </p>

      {/* 進捗バー */}
      {uploading && uploadingCount > 0 && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-moss transition-all duration-200"
            style={{ width: `${Math.round((doneCount / uploadingCount) * 100)}%` }}
          />
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-700">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) void handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
