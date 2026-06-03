"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";
import { isSvgFile, slugify } from "@/lib/utils";

export async function uploadSpotCoverImage(file: File, uid: string) {
  if (isSvgFile(file)) {
    throw new Error("SVG はアップロードできません。PNG / JPEG / WebP を使用してください。");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeBaseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "cover";
  const path = `spots/${uid}/${Date.now()}-${safeBaseName}.${extension}`;
  const storageRef = ref(getFirebaseStorage(), path);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg"
  });

  return getDownloadURL(storageRef);
}
