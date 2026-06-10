"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { PostForm } from "@/components/owner/post-form";
import { EmptyState } from "@/components/empty-state";
import { ModalShell } from "@/components/ui/modal-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { SocioRankBadge } from "@/components/ui/socio-rank-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { listSpotEventsFromFirestore } from "@/lib/firestore/events";
import { listSpotPostsFromFirestore } from "@/lib/firestore/posts";
import {
  listOwnerSpotsFromFirestore,
  setSpotPublished
} from "@/lib/firestore/spots";
import { getSocioRankProgress } from "@/lib/socio-rank";
import { Spot } from "@/lib/types";
import { RecentSociosPanel } from "@/components/owner/recent-socios-panel";
import { OpinionBoxPanel } from "@/components/owner/opinion-box-panel";

// ─── 型 ───────────────────────────────────────────────────────────────

type SpotRevenue = {
  socioCount: number;
  cancelingCount: number;
  grossMonthly: number;
  estimatedStripeFee: number;
  platformFee: number;
  netMonthly: number;
  platformFeePercent: number;
  stripeFeePercent: number;
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
    listSpotPostsFromFirestore(spotId).catch((e: unknown) => {
      console.warn(`[fetchSpotContent] posts failed for ${spotId}:`, e);
      return [];
    }),
    listSpotEventsFromFirestore(spotId).catch((e: unknown) => {
      console.warn(`[fetchSpotContent] events failed for ${spotId}:`, e);
      return [];
    })
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
  const [openBreakdowns, setOpenBreakdowns] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  type PostModal = { spotId: string; mode: "create" } | { spotId: string; mode: "edit"; postId: string } | null;
  const [postModal, setPostModal] = useState<PostModal>(null);

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
        content: await fetchSpotContent(spot.id).catch(() => null)
      }))
    ).then((results) => {
      setSummaries((prev) => {
        const next = { ...prev };
        results.forEach(({ spotId, content }) => {
          if (content) next[spotId] = { ...next[spotId], content };
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
    return <div className="panel px-6 py-8 text-sm text-ink/72">認証状態を確認中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="運営中のSPOTはログイン後に利用できます"
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
    return <div className="panel px-6 py-8 text-sm text-ink/72">SPOTを読み込み中です。</div>;
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

  // コンテンツ再読み込み（モーダル保存後）
  async function reloadContent(spotId: string) {
    const content = await fetchSpotContent(spotId);
    setSummaries((prev) => ({ ...prev, [spotId]: { ...prev[spotId], content } }));
  }

  return (
    <div className="space-y-6">

      {/* 投稿モーダル */}
      <ModalShell
        open={postModal !== null}
        onClose={() => setPostModal(null)}
        title={postModal?.mode === "edit" ? "投稿を編集" : "投稿を作成"}
        size="lg"
      >
        {postModal !== null ? (
          postModal.mode === "create" ? (
            <PostForm
              spotId={postModal.spotId}
              mode="create"
              onSuccess={() => { setPostModal(null); void reloadContent(postModal.spotId); }}
            />
          ) : (
            <PostForm
              spotId={postModal.spotId}
              mode="edit"
              postId={postModal.postId}
              onSuccess={() => { setPostModal(null); void reloadContent(postModal.spotId); }}
            />
          )
        ) : null}
      </ModalShell>

      {/* 全体サマリー（複数SPOT時） */}
      {spots.length > 1 ? (
        <section className="panel px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-sm font-bold text-ink/72">TOTAL SUPPORTERS</div>
              <div className="mt-1 text-3xl font-extrabold text-ink">
                {revenueLoaded ? totalSocio : "---"}
                <span className="ml-1 text-base font-normal text-ink/65">人</span>
              </div>
            </div>
            <div className="h-10 w-px bg-ink/10" />
            <div>
              <div className="text-sm font-bold text-ink/72">振込予定額</div>
              <div className="mt-1 text-3xl font-extrabold text-moss">
                {revenueLoaded ? `¥${totalNet.toLocaleString()}` : "---"}
              </div>
              <div className="mt-0.5 text-xs text-ink/65">
                {revenueLoaded ? "全SPOT合計（手数料控除後）" : "Stripe確認中..."}
              </div>
            </div>
            <div className="h-10 w-px bg-ink/10" />
            <div>
              <div className="text-sm font-bold text-ink/72">SPOTS</div>
              <div className="mt-1 text-3xl font-extrabold text-ink">{spots.length}</div>
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
          const socioCount = revenue?.socioCount ?? spot.socioCount;
          const rankProgress = getSocioRankProgress(socioCount);

          return (
            <article key={spot.id} className="panel px-6 py-6 sm:px-8">

              {/* ヘッダー行 */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="chip">{spot.category}</span>
                  <StatusBadge tone={isAccepting ? "success" : "warning"}>
                    {isAccepting ? "加入受付中" : "受付前"}
                  </StatusBadge>
                  <SocioRankBadge socioCount={socioCount} />
                </div>
                {/* 公開/非公開 クイック切り替え */}
                <button
                  type="button"
                  onClick={() => void handleTogglePublished(spot)}
                  disabled={togglingId === spot.id}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    spot.isPublished
                      ? "border-moss/30 bg-moss/10 text-moss hover:bg-moss/20"
                      : "border-ink/15 bg-white text-ink/68 hover:border-ink/30"
                  }`}
                >
                  {togglingId === spot.id ? "..." : spot.isPublished ? "公開中" : "非公開"}
                </button>
              </div>

              {/* SPOT名・説明 */}
              <Link href={`/spots/${spot.id}`} className="mt-4 block text-2xl font-extrabold text-ink hover:text-moss transition-colors">
                {spot.name}
              </Link>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/72">{spot.shortDescription}</p>

              {/* 収益パネル */}
              {revenue === undefined ? (
                /* ローディング */
                <div className="mt-4 h-24 animate-pulse rounded-[16px] bg-mist" />
              ) : revenue === null ? (
                /* Stripe未設定 or エラー */
                <div className="mt-4 rounded-[16px] bg-mist px-4 py-4 text-sm text-ink/65">
                  収益情報を取得できませんでした（Stripe未設定の可能性があります）
                </div>
              ) : (
                <div className="mt-4 rounded-[16px] bg-mist px-5 py-4">
                  {/* メイン指標（大きく） */}
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-wrap items-end gap-6">
                      <div>
                        <div className="text-sm font-bold text-ink/72">SUPPORTERS</div>
                        <div className="mt-1 text-2xl font-extrabold text-ink">
                          {revenue.socioCount}
                          <span className="ml-1 text-sm font-normal text-ink/65">人</span>
                        </div>
                        {rankProgress.nextRank ? (
                          <div className="mt-2 w-full max-w-[260px]">
                            <div className="flex items-center justify-between text-[13px] text-ink/65">
                              <span>{rankProgress.nextRank.label} まであと {rankProgress.remainingCount} 人</span>
                              <span>{rankProgress.nextRank.minCount}人</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/75">
                              <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#355746_0%,#d8b067_100%)]"
                                style={{ width: `${rankProgress.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs font-semibold text-cyan-800">
                            Platinum ランク達成
                          </div>
                        )}
                        {revenue.cancelingCount > 0 ? (
                          <div className="mt-0.5 text-xs text-amber-600">
                            うち{revenue.cancelingCount}人が解約予定
                          </div>
                        ) : null}
                      </div>

                      <div className="hidden h-10 w-px bg-ink/15 sm:block" />

                      <div>
                        <div className="text-sm font-bold text-ink/72">今月売上</div>
                        <div className="mt-1 text-2xl font-extrabold text-ink">
                          ¥{revenue.grossMonthly.toLocaleString()}
                          <span className="ml-1 text-sm font-normal text-ink/65">/月</span>
                        </div>
                      </div>

                      <div className="hidden h-10 w-px bg-ink/15 sm:block" />

                      <div>
                        <div className="text-sm font-bold text-ink/72">振込予定額</div>
                        <div className="mt-1 text-2xl font-extrabold text-moss">
                          ¥{revenue.netMonthly.toLocaleString()}
                          <span className="ml-1 text-sm font-normal text-ink/65">/月</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* 内訳（アコーディオン） */}
                  {revenue.grossMonthly > 0 ? (
                    <div className="mt-3 border-t border-ink/8 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenBreakdowns((prev) => ({
                            ...prev,
                            [spot.id]: !prev[spot.id]
                          }))
                        }
                        className="flex items-center gap-1 text-xs text-ink/60 hover:text-ink/72 transition"
                      >
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${openBreakdowns[spot.id] ? "rotate-180" : ""}`}
                        />
                        内訳を{openBreakdowns[spot.id] ? "閉じる" : "見る"}
                      </button>
                      {openBreakdowns[spot.id] ? (
                        <div className="mt-2 text-xs text-ink/65 space-y-0.5">
                          <div className="flex justify-between">
                            <span>決済総額</span>
                            <span>¥{revenue.grossMonthly.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stripe手数料 ({Number(revenue.stripeFeePercent.toFixed(2))}%)</span>
                            <span>−¥{revenue.estimatedStripeFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SPOT利用料 ({revenue.platformFeePercent}%)</span>
                            <span>−¥{revenue.platformFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-ink/72 pt-0.5 border-t border-ink/8">
                            <span>振込予定額</span>
                            <span>¥{revenue.netMonthly.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              {!connectReady ? (
                <div className="mt-2 text-xs text-amber-600">受取設定が必要です</div>
              ) : null}

              {/* コンテンツプレビュー */}
              {content ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[16px] bg-mist px-4 py-3 text-xs">
                    <div className="font-semibold tracking-[0.15em] text-ink/65">
                      投稿 {content.postCount}件
                    </div>
                    {content.latestPost ? (
                      <>
                        <div className="mt-1 font-semibold text-ink">{content.latestPost.title}</div>
                        <div className="mt-0.5 text-ink/65">{toDateLabel(content.latestPost.publishDate)}</div>
                      </>
                    ) : (
                      <div className="mt-1 text-ink/60">まだ投稿がありません</div>
                    )}
                  </div>
                  <div className="rounded-[16px] bg-mist px-4 py-3 text-xs">
                    <div className="font-semibold tracking-[0.15em] text-ink/65">次のイベント</div>
                    {content.nextEvent ? (
                      <>
                        <div className="mt-1 font-semibold text-ink">{content.nextEvent.title}</div>
                        <div className="mt-0.5 text-ink/65">
                          {toEventLabel(content.nextEvent.startAt)}
                          {content.nextEvent.location ? ` · ${content.nextEvent.location}` : ""}
                        </div>
                      </>
                    ) : (
                      <div className="mt-1 text-ink/60">予定されているイベントはありません</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 h-14 animate-pulse rounded-[16px] bg-mist" />
              )}

              {/* 最近加入したサポーター */}
              <RecentSociosPanel
                spotId={spot.id}
                spotShareHref={`/owner/spots/${spot.id}/share`}
                spotPublicHref={`/spots/${spot.id}`}
              />

              {/* ご意見ボックス */}
              <OpinionBoxPanel
                spot={spot}
                onSpotChange={(updated) =>
                  setSpots((prev) =>
                    prev?.map((s) => (s.id === spot.id ? { ...s, ...updated } : s)) ?? prev
                  )
                }
              />

              {/* プライマリアクション（高頻度） */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPostModal({ spotId: spot.id, mode: "create" })}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] bg-ink px-2 py-3.5 text-white transition hover:bg-ink/85 active:scale-[0.97]"
                >
                  <span className="text-xs font-semibold">投稿</span>
                </button>
                <a
                  href={`/manage/${spot.id}/events`}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] bg-ink px-2 py-3.5 text-white transition hover:bg-ink/85 active:scale-[0.97]"
                >
                  <span className="text-xs font-semibold">イベント</span>
                </a>
                <a
                  href={`/manage/${spot.id}/voices`}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] bg-ink px-2 py-3.5 text-white transition hover:bg-ink/85 active:scale-[0.97]"
                >
                  <span className="text-xs font-semibold">アンケート</span>
                </a>
              </div>

              {/* セカンダリリンク（低頻度） */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <a href={`/manage/${spot.id}/socios`} className="text-xs text-ink/65 hover:text-ink transition-colors">
                  サポーター一覧{revenue ? `（${socioCount}人）` : ""}
                </a>
                <span className="text-ink/40">·</span>
                <Link href={`/owner/spots/${spot.id}/edit`} className="text-xs text-ink/65 hover:text-ink transition-colors">
                  SPOT編集
                </Link>
                <span className="text-ink/40">·</span>
                <Link href={`/owner/spots/${spot.id}/share`} className="text-xs text-ink/65 hover:text-ink transition-colors">
                  QRコード
                </Link>
                <span className="text-ink/40">·</span>
                <Link href={`/owner/spots/${spot.id}/payout`} className={`text-xs transition-colors ${connectReady ? "text-ink/65 hover:text-ink" : "font-semibold text-amber-600 hover:text-amber-700"}`}>
                  受取設定{!connectReady ? "（未設定）" : ""}
                </Link>
              </div>

            </article>
          );
        })}
      </section>
    </div>
  );
}
