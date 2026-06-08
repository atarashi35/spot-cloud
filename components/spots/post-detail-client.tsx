"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { getUserMembership } from "@/lib/firestore/memberships";
import { getSpotPostFromFirestore } from "@/lib/firestore/posts";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotPost, UserMembership } from "@/lib/types";

export function PostDetailClient({ spotId, postId }: { spotId: string; postId: string }) {
  const { authReady, user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [post, setPost] = useState<SpotPost | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    void Promise.all([
      getSpotFromFirestore(spotId),
      getSpotPostFromFirestore(spotId, postId),
      user ? getUserMembership(user.uid, spotId) : Promise.resolve(null)
    ])
      .then(([nextSpot, nextPost, nextMembership]) => {
        setSpot(nextSpot);
        setPost(nextPost);
        setMembership(nextMembership);
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [authReady, spotId, postId, user]);

  if (!authReady || loading) {
    return (
      <div className="shell">
        <div className="panel px-6 py-8 text-sm text-ink/60 animate-pulse">読み込み中...</div>
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

  if (!post || !spot) {
    return (
      <div className="shell">
        <EmptyState title="お知らせが見つかりません" description="このお知らせは存在しないか、削除された可能性があります。" />
      </div>
    );
  }

  const isOwner = user?.uid === spot.ownerUid;
  const isMember = isOwner || membership?.status === "active";

  if (!post.isPublic && !isMember) {
    return (
      <div className="shell">
        <section className="panel px-6 py-8 sm:px-8">
          <EmptyState
            title="このお知らせはサポーター限定です"
            description="加入済みサポーターのみ閲覧できます。"
          />
          <Link href={`/spots/${spotId}/join`} className="cta-primary mt-6">
            加入ページへ
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="shell space-y-6">
      <nav className="text-sm text-ink/55">
        <Link href={`/spots/${spotId}`} className="hover:text-ink transition-colors">{spot.name}</Link>
        <span className="mx-2">/</span>
        <span>お知らせ</span>
      </nav>

      <article className="panel px-6 py-8 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="chip">POST</span>
              {!post.isPublic && <span className="chip">MEMBER ONLY</span>}
            </div>
            <div className="mt-4 text-xs font-semibold tracking-[0.18em] text-ink/55">
              {post.publishDate}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-ink">{post.title}</h1>
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
            {/* PDF ダウンロードカード */}
            {post.attachments!.filter((a) => a.type === "pdf").map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-[16px] border border-ink/10 bg-mist px-4 py-3 transition hover:bg-ink/5"
              >
                <FileText className="h-5 w-5 shrink-0 text-ink/40" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink/75">{att.name}</span>
                <span className="shrink-0 text-xs text-ink/40">ダウンロード</span>
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

        <div className="mt-6 text-sm leading-7 text-ink/75 whitespace-pre-wrap">
          {post.body}
        </div>
      </article>

      <div className="text-sm">
        <Link href={`/spots/${spotId}/member`} className="text-ink/55 hover:text-ink transition-colors">
          ← {spot.name} の限定ページに戻る
        </Link>
      </div>
    </div>
  );
}
