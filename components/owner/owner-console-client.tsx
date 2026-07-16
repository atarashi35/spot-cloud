"use client";

import Link from "next/link";
import { ChevronDown, Pencil, QrCode, Users, Gift, Landmark, Settings, Eye } from "lucide-react";
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
import { FEATURE_BOOKINGS, FEATURE_EVENTS, FEATURE_VOICES } from "@/lib/flags";
import { Spot } from "@/lib/types";
import { RecentSociosPanel } from "@/components/owner/recent-socios-panel";
import { OpinionBoxPanel } from "@/components/owner/opinion-box-panel";

const MENU_ITEM_CLS =
  "flex items-center justify-center gap-1.5 rounded-[14px] border border-ink/10 bg-mist px-3 py-2.5 text-xs font-medium text-ink/75 transition hover:border-ink/25 hover:text-ink";

// 受取設定の実状態。
// none=未連携 / review=審査中 / action=本人確認など要対応 / ready=入金可
type PayoutState = "none" | "review" | "action" | "ready";

async function fetchPayoutState(spotId: string, idToken: string): Promise<PayoutState> {
  try {
    const res = await fetch("/api/stripe/connect/status", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ spotId }),
    });
    if (!res.ok) return "none";
    const s = (await res.json()) as {
      connected?: boolean;
      onboardingComplete?: boolean;
      transfersEnabled?: boolean;
      payoutsEnabled?: boolean;
      requirementsDue?: string[];
      disabledReason?: string | null;
    };
    if (!s.connected) return "none";
    const ready =
      Boolean(s.onboardingComplete) && Boolean(s.transfersEnabled) &&
      Boolean(s.payoutsEnabled) && (s.requirementsDue?.length ?? 0) === 0;
    if (ready) return "ready";
    if (s.disabledReason === "under_review" || s.disabledReason === "requirements.pending_verification") {
      return "review";
    }
    return "action";
  } catch {
    return "none";
  }
}

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
  pendingBalance: number;
  minPayoutAmount: number;
  lastPayout: { amount: number; status: string; date: string } | null;
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

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  paid: "着金済み",
  pending: "処理中",
  in_transit: "送金中",
  canceled: "取消",
  failed: "失敗"
};

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
  // 実際の会員数（members APIの権威値）。Stripe由来のrevenue.socioCountより優先する。
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  // 受取（Connect）の実ステータス。アカウントIDの有無ではなく入金可否で判定する。
  const [payoutStatuses, setPayoutStatuses] = useState<Record<string, PayoutState>>({});
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

  // 受取（Connect）の実ステータスを各SPOT分取得
  useEffect(() => {
    if (!spots || spots.length === 0 || !user) return;

    void (async () => {
      const idToken = await user.getIdToken();
      const results = await Promise.all(
        spots.map(async (spot) => ({
          spotId: spot.id,
          state: await fetchPayoutState(spot.id, idToken),
        }))
      );
      setPayoutStatuses((prev) => {
        const next = { ...prev };
        results.forEach(({ spotId, state }) => { next[spotId] = state; });
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
                {revenueLoaded ? "全SPOT合計（手数料控除後）" : "受取状況を確認中..."}
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
          // 受取の実ステータス（取得前は浅い判定にフォールバック）
          const payoutState: PayoutState | undefined = payoutStatuses[spot.id];
          const connectReady = payoutState ? payoutState === "ready" : Boolean(spot.stripeConnectedAccountId);
          const isAccepting = spot.isPublished && connectReady;
          const socioCount = memberCounts[spot.id] ?? revenue?.socioCount ?? spot.socioCount;
          const rankProgress = getSocioRankProgress(socioCount);

          return (
            <article key={spot.id} className="panel px-6 py-6 sm:px-8">

              {/* ヘッダー行 */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="chip">{spot.category}</span>
                  <SocioRankBadge socioCount={socioCount} />
                </div>
                {/* 公開/非公開 スライドトグル */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={spot.isPublished}
                  aria-label={spot.isPublished ? "公開中（クリックで非公開）" : "非公開（クリックで公開）"}
                  onClick={() => void handleTogglePublished(spot)}
                  disabled={togglingId === spot.id}
                  className="flex items-center gap-2 disabled:opacity-50"
                >
                  {/* トラック */}
                  <span className={`relative inline-flex h-6 w-24 items-center rounded-full transition-colors duration-300 ${spot.isPublished ? "bg-teal" : "bg-ink/20"}`}>
                    {/* ラベル */}
                    <span className={`absolute text-[10px] font-semibold text-white transition-opacity duration-200 ${spot.isPublished ? "left-2.5 opacity-100" : "opacity-0"}`}>公開中</span>
                    <span className={`absolute text-[10px] font-semibold text-ink/60 transition-opacity duration-200 ${spot.isPublished ? "opacity-0" : "right-2.5 opacity-100"}`}>非公開</span>
                    {/* ノブ */}
                    <span className={`absolute h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${spot.isPublished ? "translate-x-[4.25rem]" : "translate-x-0.5"}`} />
                  </span>
                </button>
              </div>

              {/* SPOT名・説明 */}
              <div className="mt-4 flex items-center gap-2">
                <Link href={`/spots/${spot.id}`} className="text-2xl font-extrabold text-ink hover:text-moss transition-colors">
                  {spot.name}
                </Link>
                <Link
                  href={`/owner/spots/${spot.id}/edit`}
                  aria-label="SPOTを編集"
                  title="SPOTを編集"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/45 transition hover:bg-ink/5 hover:text-ink"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <Link
                  href={`/spots/${spot.id}?preview=1`}
                  target="_blank"
                  aria-label="訪問者として確認"
                  title="訪問者として確認"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/45 transition hover:bg-ink/5 hover:text-ink"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/72">{spot.shortDescription}</p>

              {/* 収益パネル */}
              {revenue === undefined ? (
                /* ローディング */
                <div className="mt-4 h-24 animate-pulse rounded-[16px] bg-mist" />
              ) : revenue === null ? (
                /* 受取設定未完了 or エラー */
                <div className="mt-4 rounded-[16px] bg-mist px-4 py-4 text-sm text-ink/65">
                  収益情報を取得できませんでした（受取設定が未完了の可能性があります）
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
                            <span>決済手数料 ({Number(revenue.stripeFeePercent.toFixed(2))}%)</span>
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

                  {/* 実際の未払い残高・次回送金までの進捗 */}
                  <div className="mt-3 border-t border-ink/8 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink/72">現在の未払い残高</span>
                      <span className="font-bold text-ink">
                        ¥{revenue.pendingBalance.toLocaleString()}
                        <span className="ml-1 font-normal text-ink/55">
                          / ¥{revenue.minPayoutAmount.toLocaleString()}で次回送金
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/75">
                      <div
                        className="h-full rounded-full bg-moss"
                        style={{
                          width: `${Math.min(100, Math.round((revenue.pendingBalance / revenue.minPayoutAmount) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-ink/60">
                      {revenue.lastPayout ? (
                        <>
                          前回の送金: {toDateLabel(revenue.lastPayout.date)}・¥
                          {revenue.lastPayout.amount.toLocaleString()}・
                          {PAYOUT_STATUS_LABEL[revenue.lastPayout.status] ?? revenue.lastPayout.status}
                        </>
                      ) : (
                        "まだ送金はありません"
                      )}
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

              {/* 最近加入した応援会員 */}
              <RecentSociosPanel
                spotId={spot.id}
                spotShareHref={`/owner/spots/${spot.id}/share`}
                spotPublicHref={`/spots/${spot.id}`}
                onActiveCount={(n) =>
                  setMemberCounts((prev) => (prev[spot.id] === n ? prev : { ...prev, [spot.id]: n }))
                }
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
              {(() => {
                const showBookings = FEATURE_BOOKINGS && spot.spotType === "performer";
                const extraTileCount = [FEATURE_EVENTS, FEATURE_VOICES, showBookings].filter(Boolean).length;
                return (
              <div className={`mt-6 grid gap-2 ${extraTileCount > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
                <button
                  type="button"
                  onClick={() => setPostModal({ spotId: spot.id, mode: "create" })}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] bg-ink px-2 py-3.5 text-white transition hover:bg-ink/85 active:scale-[0.97]"
                >
                  <span className="text-xs font-semibold">投稿</span>
                </button>
                <a
                  href={`/manage/${spot.id}/pop`}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] bg-ink px-2 py-3.5 text-white transition hover:bg-ink/85 active:scale-[0.97]"
                >
                  <span className="text-xs font-semibold">QRカード</span>
                </a>
                {FEATURE_EVENTS && (
                <a
                  href={`/manage/${spot.id}/events`}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] bg-ink px-2 py-3.5 text-white transition hover:bg-ink/85 active:scale-[0.97]"
                >
                  <span className="text-xs font-semibold">イベント</span>
                </a>
                )}
                {FEATURE_VOICES && (
                <a
                  href={`/manage/${spot.id}/voices`}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] bg-ink px-2 py-3.5 text-white transition hover:bg-ink/85 active:scale-[0.97]"
                >
                  <span className="text-xs font-semibold">アンケート</span>
                </a>
                )}
                {showBookings && (
                <a
                  href={`/manage/${spot.id}/bookings`}
                  className="flex flex-col items-center gap-1.5 rounded-[16px] bg-ink px-2 py-3.5 text-white transition hover:bg-ink/85 active:scale-[0.97]"
                >
                  <span className="text-xs font-semibold">出演依頼</span>
                </a>
                )}
              </div>
                );
              })()}

              {/* 管理メニュー（中頻度）— アイコン付きで見つけやすく */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Link href={`/owner/spots/${spot.id}/edit`} className={MENU_ITEM_CLS}>
                  <Pencil className="h-4 w-4 shrink-0 text-ink/55" />
                  <span className="truncate">SPOT編集</span>
                </Link>
                <Link href={`/owner/spots/${spot.id}/share`} className={MENU_ITEM_CLS}>
                  <QrCode className="h-4 w-4 shrink-0 text-ink/55" />
                  <span className="truncate">QRコード</span>
                </Link>
                <a href={`/manage/${spot.id}/socios`} className={MENU_ITEM_CLS}>
                  <Users className="h-4 w-4 shrink-0 text-ink/55" />
                  <span className="truncate">応援会員一覧（{socioCount}）</span>
                </a>
                <a href={`/manage/${spot.id}/benefits`} className={MENU_ITEM_CLS}>
                  <Gift className="h-4 w-4 shrink-0 text-ink/55" />
                  <span className="truncate">特典設定</span>
                </a>
              </div>

              {/* 受取設定（実ステータスで出し分け — 要対応の時だけ強く出す） */}
              <div className="mt-2">
                {payoutState === "ready" ? (
                  <Link
                    href={`/owner/spots/${spot.id}/payout`}
                    className="inline-flex items-center gap-1.5 text-xs text-ink/55 hover:text-ink transition-colors"
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    受取設定
                  </Link>
                ) : payoutState === "review" ? (
                  <div className="flex items-center justify-center gap-2 rounded-[14px] border border-ink/10 bg-mist px-3 py-2.5 text-xs font-medium text-ink/65">
                    <Landmark className="h-4 w-4 shrink-0" />
                    受取設定：審査中（3〜4営業日）
                  </div>
                ) : payoutState === "action" ? (
                  <Link
                    href={`/owner/spots/${spot.id}/payout`}
                    className="flex items-center justify-center gap-2 rounded-[14px] border border-red-300 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Landmark className="h-4 w-4 shrink-0" />
                    本人確認の追加対応が必要です（このままだと入金・新規入会ができません）
                  </Link>
                ) : (
                  <Link
                    href={`/owner/spots/${spot.id}/payout`}
                    className="flex items-center justify-center gap-2 rounded-[14px] border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    <Landmark className="h-4 w-4 shrink-0" />
                    売上を受け取る設定が未完了です（口座登録）
                  </Link>
                )}
              </div>

            </article>
          );
        })}
      </section>
    </div>
  );
}
