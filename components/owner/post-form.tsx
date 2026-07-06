"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { AttachmentsUploader } from "@/components/ui/attachments-uploader";
import { PostAttachment, SignupPlanAmount } from "@/lib/types";
import { amountToKo } from "@/lib/plan";
import { toVideoEmbedUrl } from "@/lib/utils";
import {
  createSpotPostInFirestore,
  deleteSpotPostInFirestore,
  getSpotPostFromFirestore,
  updateSpotPostInFirestore
} from "@/lib/firestore/posts";
import { getSpotFromFirestore } from "@/lib/firestore/spots";

type PostFormProps =
  | { spotId: string; mode: "create"; onSuccess?: () => void }
  | { spotId: string; mode: "edit"; postId: string; onSuccess?: () => void };

export function PostForm(props: PostFormProps) {
  const router = useRouter();
  const { authReady, user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  // 動画はYouTube/Vimeoの外部リンクで扱う（ストレージコスト回避）
  const [videoUrl, setVideoUrl] = useState("");
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 10));
  const [isPublic, setIsPublic] = useState(false);
  // undefined: 全会員 / 500: 5口以上 / 1000: 10口以上
  const [minPlanAmount, setMinPlanAmount] = useState<SignupPlanAmount | undefined>(undefined);
  const [loading, setLoading] = useState(props.mode === "edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAllowed(false);
      return;
    }

    void Promise.all([
      getSpotFromFirestore(props.spotId),
      props.mode === "edit" ? getSpotPostFromFirestore(props.spotId, props.postId) : Promise.resolve(null)
    ])
      .then(([spot, post]) => {
        setAllowed(spot?.ownerUid === user.uid);
        if (post) {
          setTitle(post.title);
          setBody(post.body);
          // 動画リンク(type:video)は専用入力へ、画像/PDFはアップローダーへ振り分け
          const atts = post.attachments ?? [];
          setVideoUrl(atts.find((a) => a.type === "video")?.url ?? "");
          setAttachments(atts.filter((a) => a.type !== "video"));
          setPublishDate(post.publishDate);
          setIsPublic(post.isPublic);
          setMinPlanAmount(post.minPlanAmount);
        }
      })
      .catch((cause: Error) => {
        setError(cause.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [props, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("保存するにはログインが必要です。");
      return;
    }

    // 動画リンクの検証＋添付へのマージ
    const trimmedVideo = videoUrl.trim();
    if (trimmedVideo && !toVideoEmbedUrl(trimmedVideo)) {
      setError("動画リンクはYouTubeまたはVimeoのURLを入力してください。");
      return;
    }
    const mergedAttachments: PostAttachment[] = trimmedVideo
      ? [...attachments, { url: trimmedVideo, type: "video", name: "動画" }]
      : attachments;

    setSaving(true);
    setError(null);

    try {
      if (props.mode === "create") {
        // Admin SDK経由でサーバー側に作成（クライアントFirestoreのオフライン永続化による
        // サイレント失敗を回避するため、APIルートを使用する）
        const token = await user.getIdToken();
        const res = await fetch(`/api/spots/${props.spotId}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, body, attachments: mergedAttachments, publishDate, isPublic, minPlanAmount: isPublic ? undefined : minPlanAmount })
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "投稿の保存に失敗しました。");
        }
        const { postId } = (await res.json()) as { postId: string };
        // 応援会員へ通知（fire-and-forget）
        void user.getIdToken().then(async (tok) => {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
            body: JSON.stringify({ spotId: props.spotId, type: "new_post", title, body: body.slice(0, 80), resourceId: postId })
          });
        });
      } else {
        await updateSpotPostInFirestore(props.spotId, props.postId, {
          title, body, attachments: mergedAttachments, publishDate, isPublic,
          minPlanAmount: isPublic ? undefined : minPlanAmount
        });
      }
      if (props.onSuccess) {
        props.onSuccess();
      } else {
        router.push(`/spots/${props.spotId}`);
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "投稿保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (props.mode !== "edit") {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteSpotPostInFirestore(props.spotId, props.postId);
      if (props.onSuccess) {
        props.onSuccess();
      } else {
        router.push(`/spots/${props.spotId}`);
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "投稿削除に失敗しました。");
    } finally {
      setDeleting(false);
    }
  }

  if (!authReady || allowed === null) {
    return <div className="panel px-6 py-8 text-sm text-ink/72">権限を確認中です。</div>;
  }

  if (!user || !allowed) {
    return (
      <EmptyState
        title="この画面は運営者のみ利用できます"
        description="ログイン中ユーザーがこの SPOT の ownerUid と一致するときだけ投稿できます。"
      />
    );
  }

  if (loading) {
    return <div className="panel px-6 py-8 text-sm text-ink/72">投稿内容を読み込み中です。</div>;
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="タイトル" required />
      <textarea className="field min-h-40" value={body} onChange={(event) => setBody(event.target.value)} placeholder="本文" required />
      <div>
        <label className="mb-2 block text-sm font-medium text-ink/72">
          画像・PDF（任意・最大5件）
        </label>
        <AttachmentsUploader
          value={attachments}
          onChange={setAttachments}
          storagePath={`spots/${props.spotId}/posts`}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-ink/72">
          動画リンク（任意・YouTube / Vimeo）
        </label>
        <input
          className="field"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          placeholder="https://youtu.be/... または https://vimeo.com/..."
          inputMode="url"
        />
        <p className="mt-1.5 text-xs text-ink/60">
          動画は限定公開などにしたYouTube/Vimeoのリンクを貼ってください。投稿の公開設定に応じて表示されます。
        </p>
      </div>
      <input className="field" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} type="date" required />
      {/* 公開設定 */}
      <div className="rounded-[20px] border border-ink/10 p-4">
        <p className="mb-3 text-sm font-bold text-ink/72">公開設定</p>
        <div className="flex gap-2">
          {([false, true] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setIsPublic(val)}
              className={`flex-1 rounded-[16px] px-4 py-3 text-sm font-medium transition ${
                isPublic === val ? "bg-ink text-white" : "bg-mist text-ink/72 hover:text-ink"
              }`}
            >
              {val ? "🌐 公開（誰でも閲覧可）" : "🔒 応援会員限定"}
            </button>
          ))}
        </div>

        {/* 対象プラン（限定投稿のときだけ・任意） */}
        {!isPublic && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-ink/65">
              対象口数（任意・口数が多いほど下位限定も閲覧できます）
            </p>
            <div className="flex gap-2">
              {([undefined, 500, 1000] as const).map((amount) => (
                <button
                  key={String(amount)}
                  type="button"
                  onClick={() => setMinPlanAmount(amount)}
                  className={`flex-1 rounded-[16px] px-3 py-2.5 text-sm font-medium transition ${
                    minPlanAmount === amount ? "bg-ink text-white" : "bg-mist text-ink/72 hover:text-ink"
                  }`}
                >
                  {amount === undefined ? "全会員" : `${amountToKo(amount)}口以上`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="cta-primary" disabled={saving || deleting}>
          {saving ? "保存中..." : props.mode === "create" ? "投稿を保存する" : "投稿を更新する"}
        </button>
        {props.mode === "edit" ? (
          <button type="button" className="cta-secondary" onClick={handleDelete} disabled={saving || deleting}>
            {deleting ? "削除中..." : "投稿を削除する"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
