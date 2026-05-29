"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import {
  createSpotEventInFirestore,
  deleteSpotEventInFirestore,
  getSpotEventFromFirestore,
  updateSpotEventInFirestore
} from "@/lib/firestore/events";
import { getSpotFromFirestore } from "@/lib/firestore/spots";

type EventFormProps =
  | { spotId: string; mode: "create" }
  | { spotId: string; mode: "edit"; eventId: string };

export function EventForm(props: EventFormProps) {
  const router = useRouter();
  const { authReady, user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [location, setLocation] = useState("");
  const [hasJoinButton, setHasJoinButton] = useState(true);
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
      props.mode === "edit" ? getSpotEventFromFirestore(props.spotId, props.eventId) : Promise.resolve(null)
    ])
      .then(([spot, event]) => {
        setAllowed(spot?.ownerUid === user.uid);
        if (event) {
          setTitle(event.title);
          setDescription(event.description);
          setStartAt(event.startAt.slice(0, 16));
          setLocation(event.location ?? "");
          setHasJoinButton(event.hasJoinButton);
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
        await createSpotEventInFirestore(props.spotId, user.uid, {
          title,
          description,
          startAt: new Date(startAt).toISOString(),
          location,
          hasJoinButton
        });
      } else {
        await updateSpotEventInFirestore(props.spotId, props.eventId, {
          title,
          description,
          startAt: new Date(startAt).toISOString(),
          location,
          hasJoinButton
        });
      }
      router.push(`/spots/${props.spotId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "イベント保存に失敗しました。");
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
      await deleteSpotEventInFirestore(props.spotId, props.eventId);
      router.push(`/spots/${props.spotId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "イベント削除に失敗しました。");
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
        description="ログイン中ユーザーがこの SPOT の ownerUid と一致するときだけイベントを作成できます。"
      />
    );
  }

  if (loading) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">イベント内容を読み込み中です。</div>;
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="イベント名" required />
      <input className="field" value={startAt} onChange={(event) => setStartAt(event.target.value)} type="datetime-local" required />
      <input className="field" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="場所" />
      <textarea className="field min-h-40" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="内容" required />
      <label className="flex items-center gap-3 rounded-[20px] bg-mist px-4 py-3 text-sm text-ink/68">
        <input type="checkbox" checked={hasJoinButton} onChange={(event) => setHasJoinButton(event.target.checked)} />
        参加ボタンを表示する
      </label>
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="cta-primary" disabled={saving || deleting}>
          {saving ? "保存中..." : props.mode === "create" ? "イベントを保存する" : "イベントを更新する"}
        </button>
        {props.mode === "edit" ? (
          <button type="button" className="cta-secondary" onClick={handleDelete} disabled={saving || deleting}>
            {deleting ? "削除中..." : "イベントを削除する"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
