/**
 * ソシオ登録フォームで入力したプロフィール情報をローカルに保持するキャッシュ。
 * 2回目以降の加入時に自動入力するために使う。
 */

export const USER_PROFILE_CACHE_KEY = "spot_user_profile";

export type UserProfileCache = {
  name: string;
  ageRange: string;
  gender: string;
};

export function saveUserProfileCache(profile: UserProfileCache) {
  try {
    localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // ストレージが使えない環境でも無視
  }
}

export function loadUserProfileCache(): UserProfileCache | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfileCache;
  } catch {
    return null;
  }
}
