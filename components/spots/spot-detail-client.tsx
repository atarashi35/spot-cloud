"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { Mail, MapPin, Phone } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { GallerySlider } from "@/components/spots/gallery-slider";
import { VoicesSection } from "@/components/spots/voices-section";
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
import { AppleWalletButton } from "@/components/account/apple-wallet-button";
import { GoogleWalletButton } from "@/components/account/google-wallet-button";
import { SocioCard } from "@/components/account/socio-card";
import { ModalShell } from "@/components/ui/modal-shell";

type FeedPost = {
  id: string; isPublic: boolean; publishDate: string;
  title: string; body: string; imageUrl: string | null;
  attachments: { url: string; type: string }[];
  masked: boolean;
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
  const [showOwnerCta, setShowOwnerCta] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const mainCtaRef = useRef<HTMLElement>(null);

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

  // メインCTAが画面外に出たらスティッキーバーを表示
  useEffect(() => {
    const el = mainCtaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [status]);

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

      // ── 1. sync-checkout: Stripe セッションから直接サポーターシップを作成 ──
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
          setShowWelcomeBanner(true);
          setShowOwnerCta(true);
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
  // canceling（解約予定）も期末まで有効なためサポーターズエリアに入れる
  const canViewMembersArea = Boolean(
    isOwner || membershipStatus === "active" || membershipStatus === "canceling"
  );
  const canAcceptMembership = Boolean(spot.stripeConnectedAccountId);
  const useRawCoverImage = spot.coverImageUrl ? isSvgAssetUrl(spot.coverImageUrl) : false;
  const showStickyJoin =
    ctaVisible &&
    !isOwner &&
    canAcceptMembership &&
    membershipStatus !== "active" &&
    membershipStatus !== "canceling";

  return (
    <div className={`space-y-8 ${showStickyJoin ? "pb-24" : ""}`}>
      <SocioSignupModal
        spot={spot}
        open={signupModalOpen}
        onClose={() => { setSignupModalOpen(false); setEmailJoinPlan(null); }}
        defaultPlan={emailJoinPlan ?? membership?.planAmount ?? 100}
        initialStep={emailJoinPlan ? "profile" : undefined}
      />

      {/* ── ウェルカムモーダル ── */}
      <ModalShell
        open={showWelcomeBanner}
        onClose={() => setShowWelcomeBanner(false)}
        title="🎉 サポーターになりました"
        size="sm"
      >
        <div className="space-y-5">
          {/* サポーター会員証プレビュー */}
          {user && membership && (
            <div className="flex justify-center">
              <div className="w-full max-w-[320px]">
                <SocioCard
                  uid={user.uid}
                  displayName={user.displayName ?? loadUserProfileCache()?.name ?? ""}
                  avatarUrl={user.photoURL}
                  memberships={[{
                    spotName: membership.spotName,
                    joinedAt: membership.joinedAt,
                    spotId: membership.spotId,
                    status: membership.status,
                  }]}
                />
              </div>
            </div>
          )}
          {/* ウォレットボタン */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1"><AppleWalletButton /></div>
            <div className="flex-1"><GoogleWalletButton /></div>
          </div>
          <p className="text-center text-xs text-ink/65">
            会員証はいつでも{" "}
            <Link href="/account" className="underline hover:text-ink" onClick={() => setShowWelcomeBanner(false)}>
              マイページ
            </Link>
            {" "}から確認できます。
          </p>
        </div>
      </ModalShell>

      {showOwnerCta && (
        <div className="flex items-center justify-between gap-4 rounded-[20px] border border-moss/20 bg-moss/8 px-5 py-4">
          <p className="text-sm font-medium text-ink">
            あなたもSPOTを作りませんか？
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/owner" className="cta-primary text-sm">
              SPOTを作る
            </Link>
            <button
              type="button"
              className="text-xs text-ink/65 hover:text-ink"
              onClick={() => setShowOwnerCta(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

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
        {/* ── ヘッダー + CTA グリッド ─────────────────────────────────── */}
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip">{spot.category}</span>
              <SocioRankBadge socioCount={spot.socioCount} />
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">{spot.name}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[2.2rem] font-extrabold tabular-nums leading-none text-teal-600">{spot.socioCount}</span>
                <span className="text-sm font-semibold text-teal-700/80">人のサポーター</span>
              </div>
              <div className="h-5 w-px bg-ink/15" />
              <MetricPill label="エリア" value={`${spot.prefecture}${spot.city ? ` / ${spot.city}` : ""}`} />
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-ink/72">
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
              <div className="mt-3 flex items-center gap-2 text-sm text-ink/72">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${spot.phone}`} className="hover:text-ink hover:underline">
                  {spot.phone}
                </a>
              </div>
            ) : null}
            {spot.email ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-ink/72">
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
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 bg-white text-ink/68 transition hover:border-ink/30 hover:text-ink"
                      aria-label={key}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
              </div>
            ) : null}
          </div>
          <aside ref={mainCtaRef} className={`flex flex-col rounded-[28px] p-5 ${
            // 未加入（メイン訴求）状態のみ黒背景で強調、それ以外はmist
            !isOwner && membershipStatus !== "active" && membershipStatus !== "canceling"
            && membershipStatus !== "past_due" && membershipStatus !== "canceled"
            && canAcceptMembership
              ? "bg-ink"
              : "bg-mist"
          }`}>
            {isOwner ? (
              <>
                <h2 className="text-2xl font-extrabold text-ink">運営中のSPOT</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StatusBadge tone="success">サポーター限定を表示中</StatusBadge>
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
                    <span className="text-xs font-semibold tabular-nums uppercase tracking-[0.15em] text-ink/65">
                      No. {String(socioNumber).padStart(4, "0")}
                    </span>
                  )}
                </div>
                {membership?.joinedAt && (
                  <div className="flex flex-1 flex-col items-center justify-center py-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">SUPPORTER Since</p>
                    <p className="mt-1 text-[88px] font-extrabold tabular-nums leading-none text-teal-600">
                      {Math.floor((Date.now() - new Date(membership.joinedAt).getTime()) / 86_400_000) + 1}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink/65">日目</p>
                  </div>
                )}
              </div>
            ) : membershipStatus === "past_due" ? (
              <>
                <h2 className="text-2xl font-extrabold text-ink">支払い確認が必要です</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StatusBadge tone="warning">{getMembershipStatusLabel(membershipStatus)}</StatusBadge>
                </div>
                <Link href="/account" className="cta-primary mt-5 w-full">
                  支払い状況を確認する
                </Link>
              </>
            ) : membershipStatus === "canceled" ? (
              <>
                <h2 className="text-2xl font-extrabold text-ink">加入は停止中です</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StatusBadge>{getMembershipStatusLabel(membershipStatus)}</StatusBadge>
                </div>
                {canAcceptMembership ? (
                  <button type="button" className="cta-primary mt-5 w-full" onClick={() => setSignupModalOpen(true)}>
                    サポーターになる
                  </button>
                ) : (
                  <div className="mt-5 rounded-[20px] bg-white px-4 py-4 text-sm text-ink/75">
                    受取設定の完了後に再加入できます。
                  </div>
                )}
              </>
            ) : !canAcceptMembership ? (
              <>
                <h2 className="text-2xl font-extrabold text-ink">加入受付は準備中です</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StatusBadge>受取設定中</StatusBadge>
                </div>
              </>
            ) : (
              /* ── 未加入・募集中（メイン訴求）── bg-ink 反転パネル */
              <div className="flex h-full flex-col">
                {/* サポーター数 */}
                {spot.socioCount > 0 ? (
                  <div>
                    <p className="text-sm font-bold text-teal-400">SUPPORTERS</p>
                    <p className="mt-1 tabular-nums leading-none">
                      <span className="text-5xl font-extrabold text-teal-400">{spot.socioCount}</span>
                      <span className="ml-2 text-base font-semibold text-white/65">人が応援中</span>
                    </p>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 self-start rounded-full bg-teal-400/15 px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span className="text-sm font-semibold text-teal-400">サポーター募集中</span>
                  </div>
                )}

                {/* 区切り */}
                <div className="my-5 border-t border-white/10" />

                {/* ベネフィット */}
                {spot.planBenefits && Object.values(spot.planBenefits).some(Boolean) ? (
                  <ul className="space-y-3">
                    {planOptions.map((amount) => {
                      const benefit = spot.planBenefits?.[amount];
                      if (!benefit) return null;
                      return (
                        <li key={amount} className="flex items-start gap-2.5 text-[15px] text-white/80">
                          <span className="mt-0.5 shrink-0 rounded-full bg-teal-400/20 px-2 py-0.5 text-xs font-bold text-teal-400">¥{amount}</span>
                          {benefit}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="space-y-3">
                    {[
                      "限定の投稿が読める",
                      "限定イベントに参加できる",
                      "このSPOTの活動を支える",
                    ].map((text) => (
                      <li key={text} className="flex items-center gap-2.5 text-[15px] text-white/80">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-xs font-bold text-teal-400">✓</span>
                        {text}
                      </li>
                    ))}
                  </ul>
                )}

                {/* 価格 + ボタン */}
                <div className="mt-auto pt-6">
                  <p className="mb-3 text-center text-sm font-semibold text-white/60">月額 100〜500円</p>
                  <button
                    type="button"
                    className="cta-primary w-full"
                    onClick={() => setSignupModalOpen(true)}
                  >
                    サポーターになる
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ── 紹介文 ───────────────────────────────────────────────────── */}
      {spot.description ? (
        <section className="panel px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/45">ABOUT</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">{spot.name}について</h2>
          <div className="mt-5 max-w-3xl space-y-5 border-t border-ink/8 pt-5">
            {spot.description.split(/\n{2,}/).map((para, i) => (
              <p key={i} className={`leading-[1.9] text-ink/80 ${i === 0 ? "text-[17px] font-medium" : "text-[15px]"}`}>
                {para.replace(/\n/g, " ")}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 運営メンバー ─────────────────────────────────────────────── */}
      {spot.teamMembers && spot.teamMembers.length > 0 && (
        <section className="panel px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/45">TEAM</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink">運営メンバー</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spot.teamMembers.map((member, i) => (
              <div key={i} className="flex items-start gap-3 rounded-[20px] border border-ink/8 bg-white p-4">
                {member.avatarUrl ? (
                  <Image
                    src={member.avatarUrl}
                    alt={member.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/8">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink/65" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-ink leading-tight">{member.name}</p>
                  <p className="mt-0.5 text-sm text-ink/65">{member.role}</p>
                  {member.bio && (
                    <p className="mt-1.5 text-[13px] leading-5 text-ink/72">{member.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
              {/* 投稿列 */}
              <div className="rounded-[28px] bg-white/60 p-6">
                <h3 className="text-2xl font-extrabold text-ink">投稿</h3>
                <div className="mt-4 space-y-4">
                  {allPosts.length === 0 ? (
                    <p className="text-[15px] text-ink/65">投稿はありません。</p>
                  ) : allPosts.map((post) => {
                    const isLocked = locked && !post.isPublic;
                    const thumb = post.attachments?.find((a) => a.type === "image")?.url ?? post.imageUrl;
                    return (
                      <article key={post.id} className="relative overflow-hidden rounded-[20px] border border-ink/8 bg-white">
                        {thumb ? (
                          <div className="relative h-44 w-full overflow-hidden">
                            <Image src={thumb} alt={post.title} fill className={`object-cover transition group-hover:scale-[1.02] ${isLocked ? "blur-sm" : ""}`} sizes="(max-width:768px) 100vw, 50vw" />
                          </div>
                        ) : null}
                        <div className={`p-5 ${isLocked ? "blur-[2px] select-none" : ""} ${isLocked && !thumb ? "min-h-[160px]" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-ink/65">{post.publishDate}</span>
                            {!post.isPublic && (
                              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">MEMBERS</span>
                            )}
                          </div>
                          <h4 className="mt-2 text-lg font-bold text-ink">{post.title}</h4>
                          <p className="mt-2 text-[15px] leading-relaxed text-ink/72 line-clamp-3">{post.body}</p>
                          {!isLocked && (
                            <div className="mt-3">
                              <Link href={`/spots/${spotId}/posts/${post.id}`} className="text-sm font-semibold text-moss hover:underline transition-colors">
                                続きを読む →
                              </Link>
                            </div>
                          )}
                        </div>
                        {isLocked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[20px] bg-white/80 backdrop-blur-[3px]">
                            <p className="text-sm font-bold text-ink/72">サポーター限定コンテンツです</p>
                            {canAcceptMembership && (
                              <button type="button" onClick={() => setSignupModalOpen(true)} className="cta-primary">
                                サポーターになる
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
                <h3 className="text-2xl font-extrabold text-ink">イベント</h3>
                <div className="mt-4 space-y-4">
                  {allEvents.length === 0 ? (
                    <p className="text-[15px] text-ink/65">イベントはありません。</p>
                  ) : allEvents.map((event) => {
                    const isLocked = locked && !event.isPublic;
                    return (
                      <article key={event.id} className="relative overflow-hidden rounded-[20px] border border-ink/8 bg-white">
                        {event.imageUrl ? (
                          <div className="relative h-44 w-full overflow-hidden">
                            <Image src={event.imageUrl} alt={event.title} fill className={`object-cover ${isLocked ? "blur-sm" : ""}`} sizes="(max-width:768px) 100vw, 50vw" />
                          </div>
                        ) : null}
                        <div className={`p-5 ${isLocked ? "blur-[2px] select-none" : ""} ${isLocked && !event.imageUrl ? "min-h-[160px]" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-ink/65">
                              {new Date(event.startAt).toLocaleString("ja-JP")}
                            </span>
                            {!event.isPublic && (
                              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">MEMBERS</span>
                            )}
                          </div>
                          <h4 className="mt-2 text-lg font-bold text-ink">{event.title}</h4>
                          <p className="mt-2 text-[15px] leading-relaxed text-ink/72 line-clamp-2">{event.description}</p>
                          {event.location ? (
                            <p className="mt-1.5 flex items-center gap-1 text-sm text-ink/65">
                              <span>📍</span>{event.location}
                            </p>
                          ) : null}
                          {!isLocked && (
                            <>
                              <div className="mt-3">
                                <Link href={`/spots/${spotId}/events/${event.id}`} className="text-sm font-semibold text-moss hover:underline transition-colors">
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
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[20px] bg-white/80 backdrop-blur-[3px]">
                            <p className="text-sm font-bold text-ink/72">サポーター限定コンテンツです</p>
                            {canAcceptMembership && (
                              <button type="button" onClick={() => setSignupModalOpen(true)} className="cta-primary">
                                サポーターになる
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
      {/* ── みんなの声 ────────────────────────────────────────────────── */}
      <VoicesSection
        spotId={spotId}
        uid={canViewMembersArea || isOwner ? user?.uid : undefined}
        amount={membership?.planAmount}
        opinionBoxEnabled={spot.opinionBoxEnabled}
        canParticipate={canViewMembersArea}
        canAcceptMembership={canAcceptMembership}
        isOwner={isOwner}
        onSignupClick={() => setSignupModalOpen(true)}
      />

      {/* ── スティッキー サポーターになるCTA ─────────────────────────────── */}
      {showStickyJoin && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 border-t border-ink/8 bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{spot.name}</p>
            <p className="text-xs text-ink/65">月100〜500円で参加できます</p>
          </div>
          <button
            type="button"
            className="cta-primary shrink-0"
            onClick={() => setSignupModalOpen(true)}
          >
            サポーターになる
          </button>
        </div>
      )}
    </div>
  );
}
