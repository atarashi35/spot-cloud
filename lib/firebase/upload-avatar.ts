import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("JPG・PNG・WebP 形式の画像を選択してください");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("ファイルサイズは 2MB 以内にしてください");
  }
  const ext = file.name.split(".").pop() ?? "jpg";
  const storageRef = ref(getFirebaseStorage(), `avatars/${uid}/profile.${ext}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
