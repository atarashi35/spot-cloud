"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { SupportSection } from "@/components/settings/support-section";
import { loadUserProfileCache } from "@/lib/user-profile-cache";
import { MetricPill } from "@/components/ui/metric-pill";
import { StatusBadge } from "@/components/ui/status-badge";
import { listUserMemberships } from "@/lib/firestore/memberships";
import { listOwnerSpotsFromFirestore } from "@/lib/firestore/spots";
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
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricPill
              label="名前"
              value={user.displayName || loadUserProfileCache()?.name || "未設定"}
            />
            <MetricPill label="メール" value={user.email ?? "未設定"} />
            <MetricPill label="ログイン方法" value={getLoginMethodLabel(user)} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink/55">ログインするとアカウント情報が表示されます。</p>
        )}
      </section>

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

      {activeMemberships.length > 0 ? (
        <section className="panel px-6 py-8 sm:px-8">
          <span className="chip">MEMBERSHIP</span>
          <h2 className="mt-4 text-2xl font-bold text-ink">メンバーシップ管理</h2>
          <p className="mt-4 text-sm leading-7 text-ink/62">
            プラン、請求日、支払い方法の変更や解約はこちらで管理できます。
          </p>
          <div className="mt-6 grid gap-3">
            {activeMemberships.map((membership) => (
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
            ))}
          </div>
        </section>
      ) : null}

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
