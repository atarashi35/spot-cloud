"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import {
  createSpotPostInFirestore,
  deleteSpotPostInFirestore,
  getSpotPostFromFirestore,
  updateSpotPostInFirestore
} from "@/lib/firestore/posts";
import { getSpotFromFirestore } from "@/lib/firestore/spots";

type PostFormProps =
  | { spotId: string; mode: "create" }
  | { spotId: string; mode: "edit"; postId: string };

export function PostForm(props: PostFormProps) {
  const router = useRouter();
  const { authReady, user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 10));
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
          setImageUrl(post.imageUrl ?? "");
          setPublishDate(post.publishDate);
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

    setSaving(true);
    setError(null);

    try {
      if (props.mode === "create") {
        await createSpotPostInFirestore(props.spotId, user.uid, {
          title,
          body,
          imageUrl,
          publishDate
        });
      } else {
        await updateSpotPostInFirestore(props.spotId, props.postId, {
          title,
          body,
          imageUrl,
          publishDate
        });
      }
      router.push(`/spots/${props.spotId}`);
      router.refresh();
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
      router.push(`/spots/${props.spotId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "投稿削除に失敗しました。");
    } finally {
      setDeleting(false);
    }
  }

  if (!authReady || allowed === null) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">権限を確認中です。</div>;
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
    return <div className="panel px-6 py-8 text-sm text-ink/60">投稿内容を読み込み中です。</div>;
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="タイトル" required />
      <textarea className="field min-h-40" value={body} onChange={(event) => setBody(event.target.value)} placeholder="本文" required />
      <input className="field" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="画像 URL" />
      <input className="field" value={publishDate} onChange={(event) => setPublishDate(event.target.value)} type="date" required />
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
