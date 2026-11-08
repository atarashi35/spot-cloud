"use client";

import type { User } from "firebase/auth";
import type { UserFollow } from "@/lib/types";

export async function getUserFollow(user: User, spotId: string) {
  const token = await user.getIdToken();
  const response = await fetch(`/api/spots/${spotId}/follow`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("無料サポーター情報を取得できませんでした。");
  const data = (await response.json()) as { follow: UserFollow | null };
  return data.follow;
}

export async function listUserFollows(user: User) {
  const token = await user.getIdToken();
  const response = await fetch("/api/account/follows", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("無料サポーター情報を取得できませんでした。");
  const data = (await response.json()) as { follows: UserFollow[] };
  return data.follows;
}
