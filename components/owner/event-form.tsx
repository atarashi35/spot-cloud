"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  createSpotEventInFirestore,
  deleteSpotEventInFirestore,
  getSpotEventFromFirestore,
  updateSpotEventInFirestore
} from "@/lib/firestore/events";
import { getSpotFromFirestore } from "@/lib/firestore/spots";

type EventFormProps =
  | { spotId: string; mode: "create"; onSuccess?: () => void }
  | { spotId: string; mode: "edit"; eventId: string; onSuccess?: () => void };

type ZipResult = {
  address1: string; // 都道府県
  address2: string; // 市区町村
  address3: string; // 町域
};

/** zipcloud.ibsnet.co.jp の無料 API で郵便番号から住所を取得 */
async function fetchAddressByZip(zipcode: string): Promise<ZipResult | null> {
  try {
    const res = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode.replace(/-/g, "")}`
    );
    const data = (await res.json()) as { results: ZipResult[] | null };
    return data.results?.[0] ?? null;
  } catch {
    return null;
  }
}

export function EventForm(props: EventFormProps) {
  const router = useRouter();
  const { authReady, user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  // 住所フィールド（郵便番号 → 自動入力）
  const [zipcode, setZipcode] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationBuilding, setLocationBuilding] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [hasJoinButton, setHasJoinButton] = useState(true);
  const [loading, setLoading] = useState(props.mode === "edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 場所の文字列を表示用にまとめる */
  const locationFull = [locationAddress, locationBuilding].filter(Boolean).join(" ");

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
          setImageUrl(event.imageUrl ?? "");
          setLocationAddress(event.location ?? "");
          setIsPublic(event.isPublic);
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

  /** 郵便番号7桁入力時に自動で住所をフェッチ */
  async function handleZipcodeChange(value: string) {
    setZipcode(value);
    setZipError(null);

    const digits = value.replace(/-/g, "");
    if (digits.length !== 7) return;

    setZipLoading(true);
    const result = await fetchAddressByZip(digits);
    setZipLoading(false);

    if (!result) {
      setZipError("郵便番号が見つかりませんでした。");
      return;
    }

    setLocationAddress(`${result.address1}${result.address2}${result.address3}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("保存するにはログインが必要です。");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        description,
        startAt: new Date(startAt).toISOString(),
        location: locationFull,
        imageUrl,
        isPublic,
        hasJoinButton
      };

      if (props.mode === "create") {
        await createSpotEventInFirestore(props.spotId, user.uid, payload);
        // 応援会員へ通知（fire-and-forget）
        void user.getIdToken().then((token) =>
          fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ spotId: props.spotId, type: "new_event", title, body: description.slice(0, 80) })
          })
        );
      } else {
        await updateSpotEventInFirestore(props.spotId, props.eventId, payload);
      }

      if (props.onSuccess) {
        props.onSuccess();
      } else {
        router.push(`/spots/${props.spotId}`);
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "イベント保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (props.mode !== "edit") return;

    setDeleting(true);
    setError(null);

    try {
      await deleteSpotEventInFirestore(props.spotId, props.eventId);
      if (props.onSuccess) {
        props.onSuccess();
      } else {
        router.push(`/spots/${props.spotId}`);
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "イベント削除に失敗しました。");
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
        description="ログイン中ユーザーがこの SPOT の ownerUid と一致するときだけイベントを作成できます。"
      />
    );
  }

  if (loading) {
    return <div className="panel px-6 py-8 text-sm text-ink/72">イベント内容を読み込み中です。</div>;
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* タイトル */}
      <label className="space-y-2">
        <span className="text-sm font-medium text-ink/72">イベント名</span>
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="〇〇イベント"
          required
        />
      </label>

      {/* 開始日時 */}
      <label className="space-y-2">
        <span className="text-sm font-medium text-ink/72">開始日時</span>
        <input
          className="field"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          type="datetime-local"
          required
        />
      </label>

      {/* 場所（郵便番号自動入力） */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-ink/72">場所</span>
        <div className="flex gap-2">
          <input
            className="field w-36"
            value={zipcode}
            onChange={(e) => void handleZipcodeChange(e.target.value)}
            placeholder="〒 000-0000"
            maxLength={8}
          />
          {zipLoading ? (
            <span className="self-center text-xs text-ink/65">検索中...</span>
          ) : null}
          {zipError ? (
            <span className="self-center text-xs text-red-600">{zipError}</span>
          ) : null}
        </div>
        <input
          className="field"
          value={locationAddress}
          onChange={(e) => setLocationAddress(e.target.value)}
          placeholder="都道府県・市区町村・番地"
        />
        <input
          className="field"
          value={locationBuilding}
          onChange={(e) => setLocationBuilding(e.target.value)}
          placeholder="建物名・部屋番号（任意）"
        />
      </div>

      {/* 内容 */}
      <label className="space-y-2">
        <span className="text-sm font-medium text-ink/72">内容</span>
        <textarea
          className="field min-h-32"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="イベントの詳細を記入してください"
          required
        />
      </label>

      {/* 画像 */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-ink/72">画像（任意）</span>
        <ImageUploader
          value={imageUrl}
          onChange={setImageUrl}
          storagePath={`spots/${user.uid}/spots/${props.spotId}/events`}
        />
      </div>

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
      </div>

      {/* 参加ボタン */}
      <label className="flex items-center gap-3 rounded-[20px] bg-mist px-4 py-3 text-sm text-ink/78">
        <input
          type="checkbox"
          checked={hasJoinButton}
          onChange={(e) => setHasJoinButton(e.target.checked)}
        />
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
