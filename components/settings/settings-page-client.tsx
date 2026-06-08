"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { multiFactor } from "firebase/auth";
import { Pencil, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { MfaEnrollmentModal } from "@/components/auth/mfa-enrollment-modal";
import { SupportSection } from "@/components/settings/support-section";
import { MetricPill } from "@/components/ui/metric-pill";
import { StatusBadge } from "@/components/ui/status-badge";
import { listUserMemberships } from "@/lib/firestore/memberships";
import { listOwnerSpotsFromFirestore } from "@/lib/firestore/spots";
import { getUserProfileDoc, saveUserProfileDoc } from "@/lib/firestore/user-profile";
import { resolveDisplayName } from "@/lib/user-profile";
import { uploadAvatar } from "@/lib/firebase/upload-avatar";
import { UserMembership } from "@/lib/types";
import type { InvoiceItem } from "@/app/api/stripe/invoices/route";

function getMembershipStatusLabel(status: UserMembership["status"]) {
  switch (status) {
    case "active":
      return "利用中";
    case "past_due":
      return "支払い確認待ち";
    case "canceled":
      return "解約済み";
    default:
      return status;
  }
}

function getMembershipTone(status: UserMembership["status"]) {
  switch (status) {
    case "active":
      return "success";
    case "past_due":
      return "warning";
    case "canceled":
      return "neutral";
    default:
      return "neutral";
  }
}

function toDateLabel(iso: string) {
  return iso.slice(0, 10).replace(/-/g, "/");
}

async function fetchNextBillingDate(idToken: string, spotId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/stripe/subscription?spotId=${spotId}`, {
      headers: { Authorization: `Bearer ${idToken}` }
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { nextBillingDate: string | null };
    return data.nextBillingDate;
  } catch {
    return null;
  }
}

function getLoginMethodLabel(user: NonNullable<ReturnType<typeof useAuth>["user"]>) {
  const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");
  // Email Link (passwordless) と Email/Password は両方 "password" provider として登録される
  const hasEmail = user.providerData.some((p) => p.providerId === "password");

  if (hasGoogle && hasEmail) return "Google / メール";
  if (hasGoogle) return "Google";
  if (hasEmail) return "メール";
  return "未設定";
}

export function SettingsPageClient() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<UserMembership[] | null>(null);
  const [ownerSpotIds, setOwnerSpotIds] = useState<Set<string>>(new Set());
  const [nextBillingDates, setNextBillingDates] = useState<Record<string, string | null>>({});
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loadingPortal, setLoadingPortal] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [mfaEnrollOpen, setMfaEnrollOpen] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);

  // プロフィール表示名
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // アバター
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // bio / occupation / specialty
  const [bio, setBio] = useState("");
  const [occupation, setOccupation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (user) {
      const factors = multiFactor(user).enrolledFactors;
      setMfaEnrolled(factors.length > 0);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void getUserProfileDoc(user.uid).then((profile) => {
      setProfileDisplayName(profile?.profileDisplayName ?? null);
      setAvatarUrl(profile?.avatarUrl ?? null);
      setBio(profile?.bio ?? "");
      setOccupation(profile?.occupation ?? "");
      setSpecialty(profile?.specialty ?? "");
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setMemberships(null);
      setOwnerSpotIds(new Set());
      return;
    }

    void Promise.all([
      listUserMemberships(user.uid),
      listOwnerSpotsFromFirestore(user.uid)
    ]).then(([nextMemberships, ownerSpots]) => {
      setMemberships(nextMemberships);
      setOwnerSpotIds(new Set(ownerSpots.map((spot) => spot.id)));
    });
  }, [user]);

  useEffect(() => {
    if (!user || !memberships) {
      return;
    }

    const targetMemberships = memberships.filter((membership) => membership.status !== "canceled");

    void user.getIdToken().then(async (token) => {
      const [billingDates, invoiceResponse] = await Promise.all([
        Promise.all(
          targetMemberships.map(async (membership) => ({
            spotId: membership.spotId,
            nextBillingDate: await fetchNextBillingDate(token, membership.spotId)
          }))
        ),
        fetch("/api/stripe/invoices", {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null)
      ]);

      setNextBillingDates(
        Object.fromEntries(billingDates.map((item) => [item.spotId, item.nextBillingDate]))
      );

      if (invoiceResponse?.ok) {
        const data = (await invoiceResponse.json()) as { invoices: InvoiceItem[] };
        setInvoices(data.invoices);
      }
    });
  }, [memberships, user]);

  function startNameEdit() {
    setNameInput(
      profileDisplayName ?? user?.displayName ?? ""
    );
    setNameError(null);
    setNameEditing(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  async function saveName() {
    if (!user) return;
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("表示名を入力してください");
      return;
    }
    if (trimmed.length > 40) {
      setNameError("40文字以内で入力してください");
      return;
    }
    setNameSaving(true);
    setNameError(null);
    try {
      await saveUserProfileDoc(user.uid, { profileDisplayName: trimmed });
      setProfileDisplayName(trimmed);
      setNameEditing(false);
    } catch {
      setNameError("保存できませんでした。もう一度お試しください。");
    } finally {
      setNameSaving(false);
    }
  }

  async function saveProfile() {
    if (!user) return;
    if (bio.length > 100) { setProfileError("ひとことは100文字以内で入力してください"); return; }
    if (occupation.length > 30) { setProfileError("職業は30文字以内で入力してください"); return; }
    if (specialty.length > 30) { setProfileError("得意なことは30文字以内で入力してください"); return; }
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      await saveUserProfileDoc(user.uid, {
        bio: bio.trim(),
        occupation: occupation.trim(),
        specialty: specialty.trim(),
        visibilityLevel: "owner_only",
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      setProfileError("保存できませんでした。もう一度お試しください。");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const url = await uploadAvatar(user.uid, file);
      await saveUserProfileDoc(user.uid, { avatarUrl: url });
      setAvatarUrl(url);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "アップロードできませんでした");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function openPortal(spotId: string) {
    if (!user) {
      return;
    }

    setLoadingPortal(spotId);
    setPortalError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ spotId })
      });

      const data = (await response.json()) as { url?: string; message?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.message ?? data.error ?? "設定画面を開けませんでした。");
      }

      window.location.href = data.url;
    } catch (cause) {
      setPortalError(cause instanceof Error ? cause.message : "設定画面を開けませんでした。");
      setLoadingPortal(null);
    }
  }

  const activeMemberships =
    memberships?.filter((membership) => membership.status !== "canceled" && !ownerSpotIds.has(membership.spotId)) ??
    [];

  return (
    <div className="space-y-6">
      {/* アカウント情報 */}
      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">ACCOUNT</span>
        <h2 className="mt-4 text-2xl font-bold text-ink">アカウント情報</h2>
        {user ? (
          <>
            {/* アバター */}
            <div className="mt-6 flex items-center gap-5">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="プロフィール画像"
                    className="h-16 w-16 rounded-full object-cover border border-ink/10"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mist border border-ink/10">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-ink/30" fill="currentColor">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-moss text-white shadow transition hover:bg-moss/80"
                  aria-label="画像を変更"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void handleAvatarChange(e)}
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">プロフィール画像</div>
                <div className="mt-0.5 text-xs text-ink/50">
                  {avatarUploading ? "アップロード中..." : "JPG・PNG・WebP / 2MB以内"}
                </div>
                {avatarError ? (
                  <div className="mt-1 text-xs text-red-600">{avatarError}</div>
                ) : null}
              </div>
            </div>

            {/* 表示名編集 */}
            <div className="mt-4 rounded-[20px] border border-ink/8 bg-mist px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold tracking-[0.15em] text-ink/45">表示名</div>
                  {nameEditing ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveName();
                          if (e.key === "Escape") setNameEditing(false);
                        }}
                        maxLength={40}
                        placeholder="表示名を入力"
                        className="w-full rounded-[12px] border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-moss"
                      />
                      {nameError ? (
                        <p className="text-xs text-red-600">{nameError}</p>
                      ) : null}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void saveName()}
                          disabled={nameSaving}
                          className="cta-primary text-xs"
                        >
                          {nameSaving ? "保存中..." : "保存する"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNameEditing(false)}
                          className="cta-secondary text-xs"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-base font-semibold text-ink truncate">
                      {resolveDisplayName(profileDisplayName, user.displayName, user.email)}
                    </div>
                  )}
                </div>
                {!nameEditing ? (
                  <button
                    type="button"
                    onClick={startNameEdit}
                    aria-label="表示名を編集"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/50 transition hover:border-moss hover:text-moss"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-[11px] leading-5 text-ink/40">
                加入SPOTで表示される名前です。メールアドレスは表示されません。
              </p>
            </div>

            {/* bio / occupation / specialty */}
            <div className="mt-4 space-y-4 rounded-[20px] border border-ink/8 bg-mist px-5 py-5">
              <div>
                <label className="block text-xs font-semibold tracking-[0.15em] text-ink/45">
                  ひとこと
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={100}
                  rows={2}
                  placeholder="好きなことや活動のことなど、自由に"
                  className="mt-2 w-full resize-none rounded-[12px] border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                />
                <div className="mt-1 text-right text-[11px] text-ink/35">{bio.length}/100</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold tracking-[0.15em] text-ink/45">
                    職業
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    maxLength={30}
                    placeholder="例：会社員、デザイナー、学生"
                    className="mt-2 w-full rounded-[12px] border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-[0.15em] text-ink/45">
                    得意なこと
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    maxLength={30}
                    placeholder="例：コーヒー、DIY、ドローン撮影"
                    className="mt-2 w-full rounded-[12px] border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  disabled={profileSaving}
                  className="cta-primary text-sm"
                >
                  {profileSaving ? "保存中..." : "保存する"}
                </button>
                {profileSaved ? (
                  <span className="text-xs font-semibold text-moss">保存しました</span>
                ) : null}
                {profileError ? (
                  <span className="text-xs text-red-600">{profileError}</span>
                ) : null}
              </div>
              <p className="text-[11px] leading-5 text-ink/35">
                この情報は加入SPOTのオーナーに共有されます。SNSには公開されません。
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricPill label="ログイン方法" value={getLoginMethodLabel(user)} />
            </div>
            {/* 二段階認証 */}
            <div className="mt-6 flex items-center justify-between gap-4 rounded-[16px] border border-ink/8 bg-mist px-4 py-4">
              <div className="flex items-center gap-3">
                {mfaEnrolled ? (
                  <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
                )}
                <div>
                  <div className="text-sm font-semibold text-ink">二段階認証（TOTP）</div>
                  <div className="text-xs leading-5 text-ink/55">
                    {mfaEnrolled
                      ? "設定済み — 認証アプリで保護されています"
                      : <>
                          未設定 — Google Authenticator・Microsoft Authenticator・<br />
                          iCloudキーチェーン（iPhone/Mac）などで設定できます
                        </>
                    }
                  </div>
                </div>
              </div>
              {!mfaEnrolled && (
                <button
                  type="button"
                  className="cta-secondary shrink-0 text-sm"
                  onClick={() => setMfaEnrollOpen(true)}
                >
                  設定する
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-ink/55">ログインするとアカウント情報が表示されます。</p>
        )}
      </section>
      <MfaEnrollmentModal
        open={mfaEnrollOpen}
        onClose={() => setMfaEnrollOpen(false)}
        onEnrolled={() => setMfaEnrolled(true)}
      />

      {/* 通知 */}
      <section className="panel px-6 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="chip">NOTIFY</span>
            <h2 className="mt-4 text-2xl font-bold text-ink">通知</h2>
          </div>
          <StatusBadge>準備中</StatusBadge>
        </div>
        <p className="mt-4 text-sm text-ink/62">
          お知らせやイベント更新の通知設定はここに集約します。
        </p>
      </section>

      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">MEMBERSHIP</span>
        <h2 className="mt-4 text-2xl font-bold text-ink">メンバーシップ管理</h2>
        <p className="mt-4 text-sm leading-7 text-ink/62">
          プラン・支払い方法の変更や解約はこちらで管理できます。
        </p>
        <div className="mt-6 grid gap-3">
          {memberships === null ? (
            /* ローディング */
            <div className="animate-pulse rounded-[20px] bg-mist px-4 py-5">
              <div className="h-3 w-1/3 rounded-full bg-ink/10" />
              <div className="mt-2 h-3 w-1/4 rounded-full bg-ink/10" />
            </div>
          ) : activeMemberships.length === 0 ? (
            /* 参加中のソシオなし */
            <div className="rounded-[20px] bg-mist px-5 py-5">
              <p className="text-sm text-ink/55">現在参加中のプランはありません。</p>
              <Link href="/" className="mt-3 inline-block text-sm font-semibold text-moss hover:underline">
                SPOTを探す →
              </Link>
            </div>
          ) : (
            activeMemberships.map((membership) => (
              <div
                key={membership.spotId}
                className="flex flex-col gap-4 rounded-[20px] border border-ink/8 bg-mist px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-ink">{membership.spotName}</div>
                    <StatusBadge tone={getMembershipTone(membership.status)}>
                      {getMembershipStatusLabel(membership.status)}
                    </StatusBadge>
                  </div>
                  <div className="mt-1 text-xs text-ink/50">
                    {`¥${membership.planAmount.toLocaleString()} / 月`}
                    {nextBillingDates[membership.spotId]
                      ? ` · 次回請求 ${toDateLabel(String(nextBillingDates[membership.spotId]))}`
                      : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="cta-secondary shrink-0"
                  onClick={() => void openPortal(membership.spotId)}
                  disabled={loadingPortal === membership.spotId}
                >
                  {loadingPortal === membership.spotId
                    ? "移動中..."
                    : membership.status === "past_due"
                    ? "支払い方法を更新"
                    : "支払い・解約を管理"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {invoices.length > 0 ? (
        <section className="panel px-6 py-8 sm:px-8">
          <span className="chip">BILLING</span>
          <h2 className="mt-4 text-2xl font-bold text-ink">請求履歴</h2>
          <div className="mt-5 divide-y divide-ink/8">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div>
                  <div className="text-sm font-semibold text-ink">
                    ¥{(inv.amount / 100).toLocaleString()}
                  </div>
                  <div className="mt-0.5 text-xs text-ink/50">
                    {toDateLabel(inv.date)}
                    {inv.status === "paid" ? " · 支払済" : inv.status === "open" ? " · 未払い" : ` · ${inv.status}`}
                  </div>
                </div>
                {inv.pdfUrl ? (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-semibold text-ink/55 hover:text-ink transition-colors"
                  >
                    PDF →
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {portalError ? <p className="px-2 text-sm font-medium text-red-700">{portalError}</p> : null}

      {/* サポート */}
      <SupportSection />

      {/* 利用情報 */}
      <section className="panel px-6 py-8 sm:px-8">
        <span className="chip">LEGAL</span>
        <h2 className="mt-4 text-2xl font-bold text-ink">利用情報</h2>
        <div className="mt-5 flex flex-col gap-3">
          <Link href="/terms" className="cta-secondary justify-start">利用規約</Link>
          <Link href="/privacy" className="cta-secondary justify-start">プライバシーポリシー</Link>
          <Link href="/law" className="cta-secondary justify-start">特定商取引法に基づく表記</Link>
        </div>
      </section>
    </div>
  );
}
