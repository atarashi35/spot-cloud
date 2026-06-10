"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";
import { isSvgFile } from "@/lib/utils";

type ImageUploaderProps = {
  /** 現在の画像URL（既存画像の表示用） */
  value: string;
  onChange: (url: string) => void;
  /** Storage上のパスプレフィックス（例: spots/abc123/posts） */
  storagePath: string;
  /** ファイルサイズ上限（MB）。デフォルト5MB */
  maxMb?: number;
};

/**
 * アップロード前に Canvas API でリサイズ・JPEG 圧縮する。
 * 長辺を maxPx に収め、quality で画質を調整。
 * これにより 5MB のスマホ写真が ~150KB 程度になる。
 */
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
        "image/webp",
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });
}

export function ImageUploader({
  value,
  onChange,
  storagePath,
  maxMb = 5
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    // バリデーション
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください（JPEG / PNG / WebP）。");
      return;
    }
    if (isSvgFile(file)) {
      setError("SVG はアップロードできません（JPEG / PNG / WebP を使用してください）。");
      return;
    }
    // 圧縮前のバリデーション（あまりに大きいファイルはcanvas処理でも重いため上限を設ける）
    if (file.size > maxMb * 1024 * 1024) {
      setError(`ファイルサイズは ${maxMb}MB 以下にしてください（圧縮前）。`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const storage = getFirebaseStorage();
      // アップロード前に圧縮（長辺1600px・JPEG 82%品質）
      // スマホ写真 ~5MB → ~150KB 程度に削減
      const compressed = await compressImage(file);
      const filename = `${Date.now()}.webp`;
      const storageRef = ref(storage, `${storagePath}/${filename}`);

      const task = uploadBytesResumable(storageRef, compressed);
      task.on("state_changed", (snap) => {
        setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      });
      await task;

      const url = await getDownloadURL(storageRef);
      onChange(url);
    } catch (err) {
      // Firebase Storage のエラーコードを日本語メッセージに変換
      const code = (err as { code?: string }).code ?? "";
      let msg = "アップロードに失敗しました。もう一度お試しください。";
      if (code === "storage/unauthorized") msg = "アップロード権限がありません。ログイン状態を確認してください。";
      else if (code === "storage/unauthenticated") msg = "ログインが必要です。";
      else if (code === "storage/quota-exceeded") msg = "ストレージの容量上限に達しました。";
      else if (code === "storage/canceled") msg = "アップロードがキャンセルされました。";
      else if (code === "storage/object-not-found") msg = "ファイルが見つかりません。再度お試しください。";
      else if (code) msg = `アップロードエラー (${code})`;
      console.error("[ImageUploader]", code, err);
      setError(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="space-y-2">
      {/* プレビュー */}
      {value ? (
        <div className="relative overflow-hidden rounded-[20px]">
          <img src={value} alt="アップロード済み画像" className="h-48 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-sm hover:bg-ink/80 transition"
            aria-label="画像を削除"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* ドロップゾーン */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-ink/15 bg-mist text-sm text-ink/65 transition hover:border-ink/30 hover:text-ink/78 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{progress}% アップロード中...</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span>クリックまたはドラッグ＆ドロップ</span>
              <span className="text-xs text-ink/58">JPEG / PNG / WebP・{maxMb}MB 以下</span>
            </>
          )}
        </button>
      )}

      {/* 進捗バー */}
      {uploading ? (
        <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-moss transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
