"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectOnboardingButton } from "@/components/owner/connect-onboarding-button";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { listSpotEventsFromFirestore } from "@/lib/firestore/events";
import { listSpotPostsFromFirestore } from "@/lib/firestore/posts";
import {
  listOwnerSpotsFromFirestore,
  setSpotPublished
} from "@/lib/firestore/spots";
import { Spot } from "@/lib/types";

// ─── 型 ───────────────────────────────────────────────────────────────

type SpotRevenue = {
  socioCount: number;
  cancelingCount: number;
  grossMonthly: number;
  netMonthly: number;
  platformFeePercent: number;
};

type SpotContent = {
  latestPost: { id: string; title: string; publishDate: string } | null;
  nextEvent: { id: string; title: string; startAt: string; location?: string } | null;
  postCount: number;
};

type SpotSummary = {
  revenue: SpotRevenue | null;
  content: SpotContent | null;
};

// ─── ユーティリティ ────────────────────────────────────────────────────

function toDateLabel(iso: string) {
  return iso.slice(0, 10).replace(/-/g, "/");
}

function toEventLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ─── データ取得 ────────────────────────────────────────────────────────

async function fetchSpotRevenue(
  spotId: string,
  idToken: string
): Promise<SpotRevenue | null> {
  try {
    const response = await fetch(
      `/api/stripe/spot-revenue?spotId=${encodeURIComponent(spotId)}`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as SpotRevenue;
  } catch {
    return null;
  }
}

async function fetchSpotContent(spotId: string): Promise<SpotContent> {
  const now = new Date();
  const [posts, events] = await Promise.all([
    listSpotPostsFromFirestore(spotId),
    listSpotEventsFromFirestore(spotId)
  ]);

  const latestPost = posts[0]
    ? { id: posts[0].id, title: posts[0].title, publishDate: posts[0].publishDate }
    : null;

  const nextEvent =
    events
      .filter((e) => new Date(e.startAt) > now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))[0] ?? null;

  return {
    latestPost,
    nextEvent: nextEvent
      ? { id: nextEvent.id, title: nextEvent.title, startAt: nextEvent.startAt, location: nextEvent.location }
      : null,
    postCount: posts.length
  };
}

// ─── コンポーネント ────────────────────────────────────────────────────

export function OwnerConsoleClient() {
  const { authReady, user } = useAuth();
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [summaries, setSummaries] = useState<Record<string, SpotSummary>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSpots(null);
      return;
    }

    void listOwnerSpotsFromFirestore(user.uid)
      .then(setSpots)
      .catch((cause: Error) => {
        setError(cause.message);
      });
  }, [user]);

  // SPOT一覧確定後にコンテンツ（投稿・イベント）を並列取得
  useEffect(() => {
    if (!spots || spots.length === 0) return;

    void Promise.all(
      spots.map(async (spot) => ({
        spotId: spot.id,
        content: await fetchSpotContent(spot.id)
      }))
    ).then((results) => {
      setSummaries((prev) => {
        const next = { ...prev };
        results.forEach(({ spotId, content }) => {
          next[spotId] = { ...next[spotId], content };
        });
        return next;
      });
    });
  }, [spots]);

  // 収益はStripe APIから直接取得（Firestoreとのズレを防ぐ）
  useEffect(() => {
    if (!spots || spots.length === 0 || !user) return;

    void (async () => {
      const idToken = await user.getIdToken();
      const results = await Promise.all(
        spots.map(async (spot) => ({
          spotId: spot.id,
          revenue: await fetchSpotRevenue(spot.id, idToken)
        }))
      );

      setSummaries((prev) => {
        const next = { ...prev };
        results.forEach(({ spotId, revenue }) => {
          next[spotId] = { ...next[spotId], revenue };
        });
        return next;
      });
    })();
  }, [spots, user]);

  async function handleTogglePublished(spot: Spot) {
    setTogglingId(spot.id);

    // 楽観的更新
    setSpots((prev) =>
      prev?.map((s) => (s.id === spot.id ? { ...s, isPublished: !s.isPublished } : s)) ?? null
    );

    try {
      await setSpotPublished(spot.id, !spot.isPublished);
    } catch {
      // 失敗時は元に戻す
      setSpots((prev) =>
        prev?.map((s) => (s.id === spot.id ? { ...s, isPublished: spot.isPublished } : s)) ?? null
      );
    } finally {
      setTogglingId(null);
    }
  }

  // ─── ガード ────────────────────────────────────────────────────────

  if (!authReady) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">認証状態を確認中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="マイSPOTはログイン後に利用できます"
        description="Google ログインを行うと、自分のSPOTを登録・編集できるようになります。"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        title="運営中のSPOTを取得できませんでした"
        description={`Firestore 接続でエラーが出ています: ${error}`}
      />
    );
  }

  if (!spots) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">SPOTを読み込み中です。</div>;
  }

  if (spots.length === 0) {
    return (
      <section className="panel px-6 py-8 sm:px-8">
        <EmptyState
          title="まだ運営中のSPOTがありません"
          description="最初のSPOTを登録すると、この画面で運営管理ができるようになります。"
        />
        <div className="mt-6">
          <Link href="/owner/spots/new" className="cta-primary">SPOTを登録する</Link>
        </div>
      </section>
    );
  }

  // 全SPOT合計サマリー（収益はStripe APIから取得した値を使用）
  const totalSocio = Object.values(summaries).reduce(
    (sum, s) => sum + (s.revenue?.socioCount ?? 0),
    0
  );
  const totalNet = Object.values(summaries).reduce(
    (sum, s) => sum + (s.revenue?.netMonthly ?? 0),
    0
  );
  const revenueLoaded = Object.values(summaries).some((s) => s.revenue !== undefined);

  return (
    <div className="space-y-6">

      {/* 全体サマリー（複数SPOT時） */}
      {spots.length > 1 ? (
        <section className="panel px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-ink/50">TOTAL SOCIO</div>
              <div className="mt-1 text-3xl font-bold text-ink">
                {revenueLoaded ? totalSocio : "---"}
                <span className="ml-1 text-base font-normal text-ink/50">人</span>
              </div>
            </div>
            <div className="h-10 w-px bg-ink/10" />
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-ink/50">MONTHLY PAYOUT</div>
              <div className="mt-1 text-3xl font-bold text-ink">
                {revenueLoaded ? `¥${totalNet.toLocaleString()}` : "---"}
              </div>
              <div className="mt-0.5 text-xs text-ink/45">
                {revenueLoaded ? "振込予定額合計（税抜）" : "Stripe確認中..."}
              </div>
            </div>
            <div className="h-10 w-px bg-ink/10" />
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-ink/50">SPOTS</div>
              <div className="mt-1 text-3xl font-bold text-ink">{spots.length}</div>
            </div>
          </div>
        </section>
      ) : null}

      {/* SPOTカード一覧 */}
      <section className="space-y-5">
        {spots.map((spot) => {
          const summary = summaries[spot.id];
          const revenue = summary?.revenue;
          const content = summary?.content;
          const isAccepting = spot.isPublished && Boolean(spot.stripeConnectedAccountId);
          const connectReady = Boolean(spot.stripeConnectedAccountId);

          return (
            <article key={spot.id} className="panel px-6 py-6 sm:px-8">

              {/* ヘッダー行 */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="chip">{spot.category}</span>
                  <StatusBadge tone={isAccepting ? "success" : "warning"}>
                    {isAccepting ? "加入受付中" : "受付前"}
                  </StatusBadge>
                </div>
                {/* 公開/非公開 クイック切り替え */}
                <button
                  type="button"
                  onClick={() => void handleTogglePublished(spot)}
                  disabled={togglingId === spot.id}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    spot.isPublished
                      ? "border-moss/30 bg-moss/10 text-moss hover:bg-moss/20"
                      : "border-ink/15 bg-white text-ink/55 hover:border-ink/30"
                  }`}
                >
                  {togglingId === spot.id ? "..." : spot.isPublished ? "公開中" : "非公開"}
                </button>
              </div>

              {/* SPOT名・説明 */}
              <h2 className="mt-4 text-2xl font-bold text-ink">{spot.name}</h2>
              <p className="mt-2 text-sm leading-7 text-ink/62">{spot.shortDescription}</p>

              {/* 収益パネル */}
              {revenue === undefined ? (
                /* ローディング */
                <div className="mt-4 h-20 animate-pulse rounded-[18px] bg-mist" />
              ) : revenue === null ? (
                /* Stripe未設定 or エラー */
                <div className="mt-4 rounded-[18px] bg-mist px-4 py-4 text-sm text-ink/50">
                  収益情報を取得できませんでした（Stripe未設定の可能性があります）
                </div>
              ) : (
                /* 収益内訳 */
                <div className="mt-4 rounded-[18px] bg-mist px-5 py-4">
                  <div className="flex flex-wrap items-end gap-6">
                    {/* ソシオ数 */}
                    <div>
                      <div className="text-xs font-semibold tracking-[0.15em] text-ink/45">SOCIO</div>
                      <div className="mt-1 text-2xl font-bold text-ink">
                        {revenue.socioCount}
                        <span className="ml-1 text-sm font-normal text-ink/50">人</span>
                      </div>
                      {revenue.cancelingCount > 0 ? (
                        <div className="mt-0.5 text-xs text-amber-600">
                          うち{revenue.cancelingCount}人が解約予定
                        </div>
                      ) : null}
                    </div>

                    <div className="h-10 w-px bg-ink/15" />

                    {/* 振込予定額（メイン表示） */}
                    <div>
                      <div className="text-xs font-semibold tracking-[0.15em] text-ink/45">振込予定額</div>
                      <div className="mt-1 text-2xl font-bold text-ink">
                        ¥{revenue.netMonthly.toLocaleString()}
                        <span className="ml-1 text-sm font-normal text-ink/50">/月</span>
                      </div>
                      <div className="mt-0.5 text-xs text-ink/40">Stripe確認済みの実績値</div>
                    </div>

                    <div className="h-10 w-px bg-ink/15 hidden sm:block" />

                    {/* 内訳 */}
                    <div className="text-xs text-ink/50 space-y-0.5">
                      <div className="flex justify-between gap-4">
                        <span>決済総額</span>
                        <span className="font-medium text-ink/70">¥{revenue.grossMonthly.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-amber-600/80">
                        <span>SPOT利用料 ({revenue.platformFeePercent}%)</span>
                        <span>−¥{Math.ceil(revenue.grossMonthly * revenue.platformFeePercent / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-ink/35 text-[10px]">
                        <span>Stripe決済手数料</span>
                        <span>SPOT負担</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!connectReady ? (
                <div className="mt-2 text-xs text-amber-600">受取設定が必要です</div>
              ) : null}

              {/* コンテンツプレビュー */}
              {content ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[18px] bg-mist px-4 py-3 text-xs">
                    <div className="font-semibold tracking-[0.15em] text-ink/45">
                      お知らせ {content.postCount}件
                    </div>
                    {content.latestPost ? (
                      <>
                        <div className="mt-1 font-semibold text-ink">{content.latestPost.title}</div>
                        <div className="mt-0.5 text-ink/50">{toDateLabel(content.latestPost.publishDate)}</div>
                      </>
                    ) : (
                      <div className="mt-1 text-ink/40">まだ投稿がありません</div>
                    )}
                  </div>
                  <div className="rounded-[18px] bg-mist px-4 py-3 text-xs">
                    <div className="font-semibold tracking-[0.15em] text-ink/45">次のイベント</div>
                    {content.nextEvent ? (
                      <>
                        <div className="mt-1 font-semibold text-ink">{content.nextEvent.title}</div>
                        <div className="mt-0.5 text-ink/50">
                          {toEventLabel(content.nextEvent.startAt)}
                          {content.nextEvent.location ? ` · ${content.nextEvent.location}` : ""}
                        </div>
                      </>
                    ) : (
                      <div className="mt-1 text-ink/40">予定されているイベントはありません</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 h-14 animate-pulse rounded-[18px] bg-mist" />
              )}

              {/* アクションボタン */}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/spots/${spot.id}/posts/new`} className="cta-primary">
                  お知らせを投稿
                </Link>
                <Link href={`/spots/${spot.id}/events/new`} className="cta-secondary">
                  イベントを作成
                </Link>
                <Link href={`/owner/spots/${spot.id}/edit`} className="cta-secondary">
                  SPOT編集
                </Link>
                <ConnectOnboardingButton
                  spotId={spot.id}
                  connected={connectReady}
                  className="cta-secondary"
                  label={connectReady ? "受取設定" : "受取設定を始める"}
                />
                <Link href={`/owner/spots/${spot.id}/share`} className="cta-secondary">
                  QR配布
                </Link>
                <Link href={`/spots/${spot.id}`} className="cta-secondary">
                  公開ページ
                </Link>
              </div>

            </article>
          );
        })}
      </section>
    </div>
  );
}
