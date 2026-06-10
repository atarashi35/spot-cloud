/**
 * 表示名の解決優先順位:
 *   1. Firestore users/{uid}.profileDisplayName (手動設定)
 *   2. Firebase Auth displayName (Google名など)
 *   3. メールアドレスの @ より前の部分
 *   4. "応援会員" (固定フォールバック)
 *
 * メールアドレスそのものは表示しない。
 */
export function resolveDisplayName(
  profileDisplayName: string | undefined | null,
  authDisplayName: string | undefined | null,
  email: string | undefined | null
): string {
  if (profileDisplayName?.trim()) return profileDisplayName.trim();
  if (authDisplayName?.trim()) return authDisplayName.trim();
  if (email?.includes("@")) return email.split("@")[0];
  return "応援会員";
}
