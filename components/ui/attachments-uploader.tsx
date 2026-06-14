"use client";

import { FileText, Film, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";
import { PostAttachment } from "@/lib/types";

const MAX_FILES = 5;
const MAX_IMAGE_MB = 10;
const MAX_PDF_MB = 20;
const MAX_VIDEO_MB = 500;

// ─── 画像圧縮 ──────────────────────────────────────────────────────────────────

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

// ─── ファイル種別判定 ──────────────────────────────────────────────────────────

function detectType(file: File): "image" | "pdf" | "video" | null {
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml") return "image";
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("video/")) return "video";
  // 拡張子でも判定（type が空のケース）
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext ?? "")) return "image";
  if (["mp4", "mov", "webm", "m4v"].includes(ext ?? "")) return "video";
  return null;
}

// ─── サムネイル・カード表示 ───────────────────────────────────────────────────

function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: PostAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[14px] bg-mist">
      {attachment.type === "image" ? (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="h-24 w-full object-cover"
        />
      ) : attachment.type === "video" ? (
        <div className="flex h-24 flex-col items-center justify-center gap-1.5 px-2">
          <Film className="h-7 w-7 text-ink/60" />
          <span className="line-clamp-2 text-center text-xs leading-tight text-ink/68">
            {attachment.name}
          </span>
        </div>
      ) : (
        <div className="flex h-24 flex-col items-center justify-center gap-1.5 px-2">
          <FileText className="h-7 w-7 text-ink/60" />
          <span className="line-clamp-2 text-center text-xs leading-tight text-ink/68">
            {attachment.name}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-sm hover:bg-ink/80 transition"
        aria-label="削除"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────────────────────

type Props = {
  value: PostAttachment[];
  onChange: (attachments: PostAttachment[]) => void;
  storagePath: string;
};

export function AttachmentsUploader({ value, onChange, storagePath }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_FILES - value.length;

  async function handleFiles(files: FileList) {
    setError(null);

    const incoming = Array.from(files).slice(0, remaining);
    if (incoming.length === 0) return;

    setUploading(true);
    setProgress(0);

    const results: PostAttachment[] = [];
    let done = 0;

    for (const file of incoming) {
      const fileType = detectType(file);

      if (!fileType) {
        setError("対応していないファイル形式です（JPEG・PNG・WebP・PDF・動画MP4/MOV/WebM）。");
        continue;
      }

      const maxMb = fileType === "pdf" ? MAX_PDF_MB : fileType === "video" ? MAX_VIDEO_MB : MAX_IMAGE_MB;
      if (file.size > maxMb * 1024 * 1024) {
        setError(`ファイルサイズは ${maxMb}MB 以下にしてください。`);
        continue;
      }

      try {
        const storage = getFirebaseStorage();
        let uploadBlob: Blob;
        let filename: string;
        let contentType: string;

        if (fileType === "image") {
          uploadBlob = await compressImage(file);
          filename = `${Date.now()}_${done}.jpg`;
          contentType = "image/jpeg";
        } else if (fileType === "pdf") {
          uploadBlob = file;
          filename = `${Date.now()}_${done}.pdf`;
          contentType = "application/pdf";
        } else {
          // video — 圧縮せずそのままアップロード、拡張子を維持
          uploadBlob = file;
          const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
          filename = `${Date.now()}_${done}.${ext}`;
          contentType = file.type || "video/mp4";
        }

        const storageRef = ref(storage, `${storagePath}/${filename}`);
        const task = uploadBytesResumable(storageRef, uploadBlob, {
          contentType,
        });

        task.on("state_changed", (snap) => {
          setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        });
        await task;

        const url = await getDownloadURL(storageRef);
        results.push({ url, type: fileType, name: file.name });
        done++;
      } catch (err) {
        const code = (err as { code?: string }).code ?? "";
        console.error("[AttachmentsUploader]", code, err);
        setError("アップロードに失敗しました。もう一度お試しください。");
      }
    }

    onChange([...value, ...results]);
    setUploading(false);
    setProgress(0);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {/* プレビューグリッド */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {value.map((att, i) => (
            <AttachmentPreview key={i} attachment={att} onRemove={() => removeAt(i)} />
          ))}
        </div>
      )}

      {/* 追加ボタン */}
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-ink/15 bg-mist text-sm text-ink/65 transition hover:border-ink/30 hover:text-ink/78 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{progress}% アップロード中...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <ImagePlus className="h-5 w-5" />
                <FileText className="h-5 w-5" />
              </div>
              <span>クリックまたはドラッグ＆ドロップ</span>
              <span className="text-xs text-ink/58">
                画像・PDF・動画（MP4/MOV/WebP・最大{MAX_VIDEO_MB}MB）・最大{MAX_FILES}件
                {value.length > 0 ? `（あと${remaining}枚）` : ""}
              </span>
            </>
          )}
        </button>
      )}

      {/* 進捗バー */}
      {uploading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-moss transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-700">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
