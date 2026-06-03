"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { Mail, MapPin, Phone } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { GallerySlider } from "@/components/spots/gallery-slider";
import { useAuth } from "@/components/providers/auth-provider";
import { EventJoinButton } from "@/components/spots/event-join-button";
import { SocioSignupModal } from "@/components/spots/socio-signup-modal";
import { MetricPill } from "@/components/ui/metric-pill";
import { SocioRankBadge } from "@/components/ui/socio-rank-badge";
import { IconGlobe, IconInstagram, IconLine, IconX, IconYouTube } from "@/components/ui/sns-icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { SpotDetailSkeleton } from "@/components/ui/skeleton";
import { getUserMembership } from "@/lib/firestore/memberships";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { EMAIL_JOIN_PENDING_KEY, EmailJoinPending } from "@/lib/auth/email-link";
import { loadUserProfileCache } from "@/lib/user-profile-cache";
import { PlanAmount, Spot, UserMembership, planOptions } from "@/lib/types";
import { isSvgAssetUrl } from "@/lib/utils";

type FeedPost = {
  id: string; isPublic: boolean; publishDate: string;
  title: string; body: string; imageUrl: string | null; masked: boolean;
};
type FeedEvent = {
  id: string; isPublic: boolean; startAt: string;
  title: string; description: string; imageUrl: string | null;
  location: string | null; hasJoinButton: boolean; participantCount: number; masked: boolean;
};

function getMembershipStatusLabel(status: UserMembership["status"]) {
  switch (status) {
    case "active":
      return "利用中";
    case "canceling":
      return "解約予定";
    case "past_due":
      return "支払い確認待ち";
    case "canceled":
      return "解約済み";
    default:
      return status;
  }
}


export function SpotDetailClient({ spotId }: { spotId: string }) {
  const { authReady, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [socioNumber, setSocioNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [emailJoinPlan, setEmailJoinPlan] = useState<PlanAmount | null>(null);

  async function loadSpotDetail(currentUser = user) {
    const nextSpot = await getSpotFromFirestore(spotId).catch((e: unknown) => { throw Object.assign(e as Error, { _step: "getSpot" }); });
    const nextMembership = await (currentUser ? getUserMembership(currentUser.uid, spotId) : Promise.resolve(null))
      .catch((e: unknown) => { throw Object.assign(e as Error, { _step: "getMembership" }); });

    if (!nextSpot) {
      setStatus("missing");
      return;
    }

    const isOwner = currentUser?.uid === nextSpot.ownerUid;
    const canReadProtectedContent = Boolean(
      isOwner ||
      nextMembership?.status === "active" ||
      nextMembership?.status === "canceling"
    );

    const feedHeaders: HeadersInit = {};
    if (currentUser) {
      const token = await currentUser.getIdToken();
      feedHeaders["authorization"] = `Bearer ${token}`;
    }
    const feedRes = await fetch(`/api/spots/${spotId}/feed`, { headers: feedHeaders });
    const feedData = await feedRes.json() as { posts: FeedPost[]; events: FeedEvent[] };
    const nextPosts = feedData.posts ?? [];
    const nextEvents = feedData.events ?? [];

    setSpot(nextSpot);
    setPosts(nextPosts);
    setEvents(nextEvents);
    setMembership(nextMembership);
    setStatus("ready");

    if (currentUser && (nextMembership?.status === "active" || nextMembership?.status === "canceling")) {
      currentUser.getIdToken().then((token) =>
        fetch(`/api/spots/${spotId}/socio-number`, { headers: { authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((data: { number: number | null }) => { if (data.number !== null) setSocioNumber(data.number); })
          .catch(() => {})
      );
    }
  }

  useEffect(() => {
    if (!authReady) {
      return;
    }

    void loadSpotDetail()
      .catch((err: unknown) => {
        console.error("[SpotDetail] load error:", err);
        const code = (err as { code?: string })?.code ?? "";
        setStatus(code === "permission-denied" ? "missing" : "error");
      });
  }, [authReady, spotId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // メールリンク認証コールバック後の自動モーダルオープン
  // URL パラメータではなく sessionStorage 経由で受け取る（ルーティング競合回避）
  useEffect(() => {
    if (!authReady || !user) return;

    const raw = sessionStorage.getItem(EMAIL_JOIN_PENDING_KEY);
    if (!raw) return;

    try {
      const pending = JSON.parse(raw) as EmailJoinPending;
      // 別の SPOT の pending が残っている場合はスキップ
      if (pending.spotId !== spotId) return;

      sessionStorage.removeItem(EMAIL_JOIN_PENDING_KEY);
      const plan = (planOptions.includes(pending.planAmount as PlanAmount)
        ? pending.planAmount
        : 100) as PlanAmount;
      setEmailJoinPlan(plan);
      setSignupModalOpen(true);
    } catch {
      sessionStorage.removeItem(EMAIL_JOIN_PENDING_KEY);
    }
  }, [authReady, user?.uid, spotId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("signup") !== "1") return;
    setEmailJoinPlan(null);
    setSignupModalOpen(true);
    router.replace(`/spots/${spotId}`);
  }, [searchParams, router, spotId]);

  useEffect(() => {
    if (!authReady || !user) return;
    if (searchParams.get("checkout") !== "success") return;

    let cancelled = false;
    const currentUser = user;
    // Stripe が {CHECKOUT_SESSION_ID} テンプレートで埋め込んだセッション ID
    const sessionId = searchParams.get("sid") ?? "";

    async function syncAfterCheckout() {
      // ── 0. displayName が未設定ならキャッシュから Firebase Auth に反映 ──────
      // startCheckout() 内の updateProfile はStripeリダイレクト直前のため
      // ページ遷移と競合することがある。戻ってきたこのタイミングで確実に実行する。
      if (!currentUser.displayName) {
        const cached = loadUserProfileCache();
        if (cached?.name) {
          try {
            await updateProfile(currentUser, { displayName: cached.name });
          } catch {
            // no-op
          }
        }
      }

      const token = await currentUser.getIdToken();

      // ── 1. sync-checkout: Stripe セッションから直接メンバーシップを作成 ──
      // Webhook に依存しないフォールバック（ローカル開発・Webhook 遅延対策）
      if (sessionId) {
        try {
          await fetch("/api/stripe/sync-checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
          });
        } catch {
          // no-op: Webhook が先に処理済みの場合も含め、次のポーリングで確認
        }
      }

      // ── 2. メール引き継ぎ（旧ゲスト購入者向け。現在は基本不要） ──────
      try {
        await fetch("/api/auth/claim-memberships", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // no-op
      }

      // ── 3. Firestore に反映されるまでポーリング ────────────────────────
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (cancelled) return;

        await loadSpotDetail(currentUser);

        const currentMembership = await getUserMembership(currentUser.uid, spotId);
        if (currentMembership) {
          router.replace(`/spots/${spotId}`);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    void syncAfterCheckout();

    return () => {
      cancelled = true;
    };
  }, [authReady, user, searchParams, spotId, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authReady || status === "loading") {
    return <SpotDetailSkeleton />;
  }

  if (status === "error") {
    return (
      <EmptyState
        title="SPOT 詳細を取得できませんでした"
        description="Firestore から詳細を読めませんでした。設定と権限を確認してください。"
      />
    );
  }

  if (status === "missing" || !spot) {
    return (
      <EmptyState
        title="SPOT が見つかりません"
        description="指定された SPOT は存在しないか、まだ公開されていません。"
      />
    );
  }

  const isOwner = user?.uid === spot.ownerUid;
  if (spot.isSuspended && !isOwner) {
    return (
      <EmptyState
        title="SPOT が見つかりません"
        description="指定された SPOT は現在公開停止中です。"
      />
    );
  }

  const membershipStatus = membership?.status;
  // canceling（解約予定）も期末まで有効なためメンバーズエリアに入れる
  const canViewMembersArea = Boolean(
    isOwner || membershipStatus === "active" || membershipStatus === "canceling"
  );
  const canAcceptMembership = Boolean(spot.stripeConnectedAccountId);
  const useRawCoverImage = spot.coverImageUrl ? isSvgAssetUrl(spot.coverImageUrl) : false;

  return (
    <div className="space-y-8">
      <SocioSignupModal
        spot={spot}
        open={signupModalOpen}
        onClose={() => { setSignupModalOpen(false); setEmailJoinPlan(null); }}
        defaultPlan={emailJoinPlan ?? membership?.planAmount ?? 100}
        initialStep={emailJoinPlan ? "profile" : undefined}
      />

      <section className="panel overflow-hidden">
        <div className="relative h-64 w-full">
          {spot.coverImageUrl ? (
            <Image
              alt={spot.name}
              src={spot.coverImageUrl}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              unoptimized={useRawCoverImage}
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${spot.coverTone}`} />
          )}
        </div>
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip">{spot.category}</span>
              <SocioRankBadge socioCount={spot.socioCount} />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">{spot.name}</h1>
            <p className="mt-5 max-w-3xl text-sm leading-8 text-ink/72 sm:text-base">{spot.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <MetricPill label="ソシオ" value={`${spot.socioCount}人`} />
              <MetricPill label="エリア" value={`${spot.prefecture}${spot.city ? ` / ${spot.city}` : ""}`} />
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-ink/62">
              <MapPin className="h-4 w-4 shrink-0" />
              <a
                href={`https://maps.google.com/maps?q=${encodeURIComponent(spot.address)}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink hover:underline"
              >
                {spot.address}
              </a>
            </div>
            {spot.phone ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-ink/62">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${spot.phone}`} className="hover:text-ink hover:underline">
                  {spot.phone}
                </a>
              </div>
            ) : null}
            {spot.email ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-ink/62">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${spot.email}`} className="hover:text-ink hover:underline">
                  {spot.email}
                </a>
              </div>
            ) : null}
            {/* SNS リンク */}
            {spot.socialLinks && Object.values(spot.socialLinks).some(Boolean) ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { key: "website",   href: spot.socialLinks.website,   Icon: IconGlobe },
                  { key: "instagram", href: spot.socialLinks.instagram, Icon: IconInstagram },
                  { key: "twitter",   href: spot.socialLinks.twitter,   Icon: IconX },
                  { key: "line",      href: spot.socialLinks.line,      Icon: IconLine },
                  { key: "youtube",   href: spot.socialLinks.youtube,   Icon: IconYouTube }
                ]
                  .filter((s) => s.href)
                  .map(({ key, href, Icon }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 bg-white text-ink/55 transition hover:border-ink/30 hover:text-ink"
                      aria-label={key}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
              </div>
            ) : null}
          </div>
          <aside className="flex flex-col rounded-[28px] bg-mist p-5">
            {isOwner ? (
              <>
                <h2 className="text-xl font-bold text-ink">運営中のSPOT</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StatusBadge tone="success">ソシオ限定を表示中</StatusBadge>
                </div>
                <Link href="/manage" className="cta-secondary mt-5 w-full">
                  管理画面へ
                </Link>
              </>
            ) : membershipStatus === "active" || membershipStatus === "canceling" ? (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <StatusBadge tone={membershipStatus === "canceling" ? "warning" : "success"}>
                    {membershipStatus === "canceling" ? "解約予定（期末まで有効）" : "利用中"}
                  </StatusBadge>
                  {socioNumber !== null && (
                    <span className="text-[10px] font-semibold tabular-nums uppercase tracking-[0.15em] text-ink/35">
                      No. {String(socioNumber).padStart(4, "0")}
                    </span>
                  )}
                </div>
                {membership?.joinedAt && (
                  <div className="flex flex-1 flex-col items-center justify-center py-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/35">Member Since</p>
                    <p className="mt-1 text-[88px] font-bold tabular-nums leading-none text-ink">
                      {Math.floor((Date.now() - new Date(membership.joinedAt).getTime()) / 86_400_000) + 1}
                    </p>
                    <p className="mt-2 text-sm tracking-wide text-ink/40">日目</p>
                  </div>
                )}
              </div>
            ) : membershipStatus === "past_due" ? (
              <>
                <h2 className="text-xl font-bold text-ink">支払い確認が必要です</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StatusBadge tone="warning">{getMembershipStatusLabel(membershipStatus)}</StatusBadge>
                </div>
                <Link href="/account" className="cta-primary mt-5 w-full">
                  支払い状況を確認する
                </Link>
              </>
            ) : membershipStatus === "canceled" ? (
              <>
                <h2 className="text-xl font-bold text-ink">加入は停止中です</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StatusBadge>{getMembershipStatusLabel(membershipStatus)}</StatusBadge>
                </div>
                {canAcceptMembership ? (
                  <button type="button" className="cta-primary mt-5 w-full" onClick={() => setSignupModalOpen(true)}>
                    ソシオになる
                  </button>
                ) : (
                  <div className="mt-5 rounded-[20px] bg-white px-4 py-4 text-sm text-ink/65">
                    受取設定の完了後に再加入できます。
                  </div>
                )}
              </>
            ) : !canAcceptMembership ? (
              <>
                <h2 className="text-xl font-bold text-ink">加入受付は準備中です</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StatusBadge>受取設定中</StatusBadge>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-ink">ソシオになる</h2>
                {spot.socioCount > 0 ? (
                  <div className="mt-4">
                    <p className="text-4xl font-bold tabular-nums text-ink">{spot.socioCount}
                      <span className="ml-1.5 text-base font-normal text-ink/45">人が応援中</span>
                    </p>
                  </div>
                ) : null}
                <ul className="mt-4 space-y-2">
                  {[
                    "限定のお知らせが読める",
                    "限定イベントに参加できる",
                    "このSPOTの活動を支える",
                  ].map((text) => (
                    <li key={text} className="flex items-center gap-2 text-sm text-ink/65">
                      <span className="text-ink/30">—</span>
                      {text}
                    </li>
                  ))}
                </ul>
                <button type="button" className="cta-primary mt-5 w-full" onClick={() => setSignupModalOpen(true)}>
                  ソシオになる
                </button>
              </>
            )}
          </aside>
        </div>
      </section>

      {/* ── ギャラリー ───────────────────────────────────────────────── */}
      {spot.galleryImageUrls && spot.galleryImageUrls.length > 0 && (
        <GallerySlider images={spot.galleryImageUrls} />
      )}

      {/* ── 統合フィード ─────────────────────────────────────────────── */}
      {(() => {
        const allPosts = posts;
        const allEvents = events;
        if (allPosts.length === 0 && allEvents.length === 0 && !isOwner) return null;

        const locked = !canViewMembersArea;

        return (
          <section className="panel px-6 py-8 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              {/* お知らせ列 */}
              <div className="rounded-[28px] bg-white/60 p-6">
                <h3 className="text-xl font-bold text-ink">お知らせ</h3>
                <div className="mt-4 space-y-4">
                  {allPosts.length === 0 ? (
                    <p className="text-sm text-ink/50">お知らせはありません。</p>
                  ) : allPosts.map((post) => {
                    const isLocked = locked && !post.isPublic;
                    return (
                      <article key={post.id} className="relative overflow-hidden rounded-[20px] bg-mist">
                        {post.imageUrl ? (
                          <div className="relative h-44 w-full">
                            <Image src={post.imageUrl} alt={post.title} fill className={`object-cover ${isLocked ? "blur-sm" : ""}`} sizes="(max-width:768px) 100vw, 50vw" />
                          </div>
                        ) : null}
                        <div className={`p-5 ${isLocked ? "blur-[2px] select-none" : ""} ${isLocked && !post.imageUrl ? "min-h-[160px]" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold tracking-[0.18em] text-ink/55">{post.publishDate}</span>
                            {!post.isPublic && (
                              <span className="rounded-full bg-ink/8 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-ink/50">MEMBERS</span>
                            )}
                          </div>
                          <h4 className="mt-2 text-base font-bold text-ink">{post.title}</h4>
                          <p className="mt-2 text-sm leading-7 text-ink/68 line-clamp-3">{post.body}</p>
                          {!isLocked && (
                            <div className="mt-3">
                              <Link href={`/spots/${spotId}/posts/${post.id}`} className="text-xs font-semibold text-ink/55 hover:text-ink transition-colors">
                                続きを読む →
                              </Link>
                            </div>
                          )}
                        </div>
                        {isLocked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-white/70 backdrop-blur-[3px]">
                            <p className="text-[10px] font-semibold tracking-[0.2em] text-ink/40">MEMBERS ONLY</p>
                            {canAcceptMembership && (
                              <button type="button" onClick={() => setSignupModalOpen(true)} className="rounded-full border border-ink/20 bg-white px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-ink/40 hover:shadow">
                                ソシオになる
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* イベント列 */}
              <div className="rounded-[28px] bg-white/60 p-6">
                <h3 className="text-xl font-bold text-ink">イベント</h3>
                <div className="mt-4 space-y-4">
                  {allEvents.length === 0 ? (
                    <p className="text-sm text-ink/50">イベントはありません。</p>
                  ) : allEvents.map((event) => {
                    const isLocked = locked && !event.isPublic;
                    return (
                      <article key={event.id} className="relative overflow-hidden rounded-[20px] bg-mist">
                        {event.imageUrl ? (
                          <div className="relative h-44 w-full">
                            <Image src={event.imageUrl} alt={event.title} fill className={`object-cover ${isLocked ? "blur-sm" : ""}`} sizes="(max-width:768px) 100vw, 50vw" />
                          </div>
                        ) : null}
                        <div className={`p-5 ${isLocked ? "blur-[2px] select-none" : ""} ${isLocked && !event.imageUrl ? "min-h-[160px]" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold tracking-[0.18em] text-ink/55">
                              {new Date(event.startAt).toLocaleString("ja-JP")}
                            </span>
                            {!event.isPublic && (
                              <span className="rounded-full bg-ink/8 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-ink/50">MEMBERS</span>
                            )}
                          </div>
                          <h4 className="mt-2 text-base font-bold text-ink">{event.title}</h4>
                          <p className="mt-2 text-sm leading-7 text-ink/68 line-clamp-2">{event.description}</p>
                          {event.location ? (
                            <p className="mt-1 text-sm text-ink/55">📍 {event.location}</p>
                          ) : null}
                          {!isLocked && (
                            <>
                              <div className="mt-3">
                                <Link href={`/spots/${spotId}/events/${event.id}`} className="text-xs font-semibold text-ink/55 hover:text-ink transition-colors">
                                  詳細を見る →
                                </Link>
                              </div>
                              {event.hasJoinButton && (
                                <EventJoinButton spotId={spotId} eventId={event.id} participantCount={event.participantCount} />
                              )}
                            </>
                          )}
                        </div>
                        {isLocked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-white/70 backdrop-blur-[3px]">
                            <p className="text-[10px] font-semibold tracking-[0.2em] text-ink/40">MEMBERS ONLY</p>
                            {canAcceptMembership && (
                              <button type="button" onClick={() => setSignupModalOpen(true)} className="rounded-full border border-ink/20 bg-white px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-ink/40 hover:shadow">
                                ソシオになる
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
