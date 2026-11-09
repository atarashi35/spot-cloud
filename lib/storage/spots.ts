"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";
import { isSvgFile, slugify } from "@/lib/utils";
import { compressImage, imageExtension } from "@/lib/storage/compress-image";

export async function uploadSpotCoverImage(file: File, uid: string) {
  if (isSvgFile(file)) {
    throw new Error("SVG はアップロードできません。PNG / JPEG / WebP を使用してください。");
  }

  if (!file.type.startsWith("image/") || file.size > 30 * 1024 * 1024) throw new Error("30MB以下の画像を選択してください。");
  const compressed = await compressImage(file);
  const extension = imageExtension(compressed);
  const safeBaseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "cover";
  const path = `spots/${uid}/${Date.now()}-${safeBaseName}.${extension}`;
  const storageRef = ref(getFirebaseStorage(), path);

  await uploadBytes(storageRef, compressed, {
    contentType: compressed.type
  });

  return getDownloadURL(storageRef);
}
