"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText, Film } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotPost } from "@/lib/types";
import { toVideoEmbedUrl } from "@/lib/utils";

export function PostDetailClient({ spotId, postId }: { spotId: string; postId: string }) {
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [post, setPost] = useState<SpotPost | null>(null);
  // 認可で弾かれたとき、ゲート表示に使う最低プラン金額
  const [forbidden, setForbidden] = useState<{ minPlanAmount?: 500 | 1000 } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    async function load() {
      try {
        const nextSpot = await getSpotFromFirestore(spotId);
        setSpot(nextSpot);

        // 投稿はサーバー側で認可してから取得（限定コンテンツは未認可者に返らない）
        const token = user ? await user.getIdToken() : null;
        const res = await fetch(`/api/spots/${spotId}/posts/${postId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.status === 403) {
          const data = (await res.json()) as { minPlanAmount?: 500 | 1000 };
          setForbidden({ minPlanAmount: data.minPlanAmount });
        } else if (res.ok) {
          const data = (await res.json()) as { post: SpotPost };
          setPost(data.post);
        } else if (res.status === 404) {
          setPost(null);
        } else {
          setError("投稿の読み込みに失敗しました。");
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [authReady, spotId, postId, user]);

  if (!authReady || loading) {
    return (
      <div className="shell">
        <div className="panel px-6 py-8 text-sm text-ink/72 animate-pulse">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell">
        <EmptyState title="読み込みに失敗しました" description={error} />
      </div>
    );
  }

  if (forbidden) {
    const tierLabel = forbidden.minPlanAmount
      ? `¥${forbidden.minPlanAmount.toLocaleString()}以上の応援会員限定`
      : "応援会員限定";
    return (
      <div className="shell">
        <section className="panel px-6 py-8 sm:px-8">
          <EmptyState
            title={`この投稿は${tierLabel}です`}
            description="対象プランの応援会員のみ閲覧できます。"
          />
          <Link href={`/spots/${spotId}`} className="cta-primary mt-6">
            SPOTページへ
          </Link>
        </section>
      </div>
    );
  }

  if (!post || !spot) {
    return (
      <div className="shell">
        <EmptyState title="投稿が見つかりません" description="この投稿は存在しないか、削除された可能性があります。" />
      </div>
    );
  }

  const isOwner = user?.uid === spot.ownerUid;

  return (
    <div className="shell space-y-6">
      <nav className="text-sm text-ink/68">
        <Link href={`/spots/${spotId}`} className="hover:text-ink transition-colors">{spot.name}</Link>
        <span className="mx-2">/</span>
        <span>投稿</span>
      </nav>

      <article className="panel px-6 py-8 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="chip">POST</span>
              {!post.isPublic && <span className="chip">MEMBER ONLY</span>}
            </div>
            <div className="mt-4 text-sm font-bold text-ink/72">
              {post.publishDate}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-ink">{post.title}</h1>
          </div>
          {isOwner && (
            <Link
              href={`/spots/${spotId}/posts/${postId}/edit`}
              className="cta-secondary shrink-0"
            >
              編集
            </Link>
          )}
        </div>

        {(post.attachments ?? []).length > 0 && (
          <div className="mt-6 space-y-3">
            {/* 画像ギャラリー */}
            {post.attachments!.filter((a) => a.type === "image").length > 0 && (
              <div className={`grid gap-2 ${post.attachments!.filter((a) => a.type === "image").length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {post.attachments!.filter((a) => a.type === "image").map((att, i) => (
                  <div key={i} className="overflow-hidden rounded-[20px]">
                    <Image
                      src={att.url}
                      alt={att.name || post.title}
                      width={800}
                      height={400}
                      className="w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            {/* 動画（YouTube / Vimeo 埋め込み） */}
            {post.attachments!.filter((a) => a.type === "video").map((att, i) => {
              const embed = toVideoEmbedUrl(att.url);
              return embed ? (
                <div key={`v${i}`} className="aspect-video overflow-hidden rounded-[20px] bg-black">
                  <iframe
                    src={embed}
                    title={att.name || "動画"}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  key={`v${i}`}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-[16px] border border-ink/10 bg-mist px-4 py-3 transition hover:bg-ink/5"
                >
                  <Film className="h-5 w-5 shrink-0 text-ink/60" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink/75">動画を見る</span>
                </a>
              );
            })}
            {/* PDF ダウンロードカード */}
            {post.attachments!.filter((a) => a.type === "pdf").map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-[16px] border border-ink/10 bg-mist px-4 py-3 transition hover:bg-ink/5"
              >
                <FileText className="h-5 w-5 shrink-0 text-ink/60" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink/75">{att.name}</span>
                <span className="shrink-0 text-xs text-ink/60">ダウンロード</span>
              </a>
            ))}
          </div>
        )}
        {/* 旧フィールド後方互換 */}
        {!post.attachments?.length && post.imageUrl && (
          <div className="mt-6 overflow-hidden rounded-[20px]">
            <Image
              src={post.imageUrl}
              alt={post.title}
              width={800}
              height={400}
              className="w-full object-cover"
            />
          </div>
        )}

        <div className="mt-6 text-[15px] leading-relaxed text-ink/75 whitespace-pre-wrap">
          {post.body}
        </div>
      </article>

      <div className="text-sm">
        <Link href={`/spots/${spotId}`} className="text-ink/68 hover:text-ink transition-colors">
          ← {spot.name} に戻る
        </Link>
      </div>
    </div>
  );
}
