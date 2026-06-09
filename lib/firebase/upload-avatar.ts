import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function compressToWebP(file: File, maxPx = 400, quality = 0.82): Promise<Blob> {
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

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("JPG・PNG・WebP 形式の画像を選択してください");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("ファイルサイズは 2MB 以内にしてください");
  }
  const compressed = await compressToWebP(file);
  const storageRef = ref(getFirebaseStorage(), `avatars/${uid}/profile.webp`);
  await uploadBytes(storageRef, compressed, { contentType: "image/webp" });
  return getDownloadURL(storageRef);
}
