"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PostalCodeField } from "@/components/forms/postal-code-field";
import { useAuth } from "@/components/providers/auth-provider";
import {
  createSpotInFirestore,
  getSpotFromFirestore,
  updateSpotInFirestore
} from "@/lib/firestore/spots";
import { uploadSpotCoverImage } from "@/lib/storage/spots";
import { SpotCategory } from "@/lib/types";

const prefectures = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県"
] as const;

const categories: SpotCategory[] = [
  "カフェ",
  "神社",
  "アート",
  "文化施設",
  "市民団体",
  "スポーツ",
  "商店街",
  "自治会",
  "クリエイター",
  "その他"
];

type SpotFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      spotId: string;
    };

export function SpotForm(props: SpotFormProps) {
  const router = useRouter();
  const { authReady, user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SpotCategory>("カフェ");
  const [postalCode, setPostalCode] = useState("");
  const [prefecture, setPrefecture] = useState<(typeof prefectures)[number]>("東京都");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(props.mode === "edit");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (props.mode !== "edit") {
      return;
    }

    void getSpotFromFirestore(props.spotId)
      .then((spot) => {
        if (!spot) {
          setError("SPOT が見つかりません。");
          return;
        }

        setName(spot.name);
        setCategory(spot.category);
        setPrefecture(
          prefectures.includes(spot.prefecture as (typeof prefectures)[number])
            ? (spot.prefecture as (typeof prefectures)[number])
            : "東京都"
        );
        setPostalCode("");
        setCity(spot.city);
        const addressRest = spot.address.startsWith(`${spot.prefecture}${spot.city}`)
          ? spot.address.slice(`${spot.prefecture}${spot.city}`.length)
          : spot.address.replace(`${spot.prefecture}${spot.city}`, "");
        setAddressLine(addressRest);
        setDescription(spot.description);
        setCoverImageUrl(spot.coverImageUrl ?? "");
        setIsPublished(spot.isPublished);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [props]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("保存するにはログインが必要です。");
      return;
    }

    setSaving(true);
    setError(null);

    const normalizedCity = city.trim();
    const normalizedAddressLine = addressLine.trim();
    const fullAddress = `${prefecture}${normalizedCity}${normalizedAddressLine}`;

    if (!normalizedCity || !normalizedAddressLine) {
      setError("市区町村と以降の住所を入力してください。");
      setSaving(false);
      return;
    }

    try {
      if (props.mode === "create") {
        const spotId = await createSpotInFirestore(
          {
            name,
            category,
            address: fullAddress,
            prefecture,
            city: normalizedCity,
            description,
            coverImageUrl,
            isPublished
          },
          user.uid
        );
        router.push(`/owner/spots/${spotId}/edit`);
        router.refresh();
        return;
      }

      await updateSpotInFirestore(props.spotId, {
        name,
        category,
        address: fullAddress,
        prefecture,
        city: normalizedCity,
        description,
        coverImageUrl,
        isPublished
      });
      router.push("/manage");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !user) {
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const downloadUrl = await uploadSpotCoverImage(file, user.uid);
      setCoverImageUrl(downloadUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "画像アップロードに失敗しました。");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  if (!authReady) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">認証状態を確認中です。</div>;
  }

  if (!user) {
    return (
      <EmptyState
        title="SPOT の保存にはログインが必要です"
        description="Google ログイン後に、SPOT の作成と編集ができるようになります。"
      />
    );
  }

  if (loading) {
    return <div className="panel px-6 py-8 text-sm text-ink/60">SPOT 情報を読み込み中です。</div>;
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <input
        className="field"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="SPOT名"
        required
      />
      <select
        className="field"
        value={category}
        onChange={(event) => setCategory(event.target.value as SpotCategory)}
      >
        {categories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <PostalCodeField
        onResolved={({ postalCode: nextPostalCode, prefecture: nextPrefecture, city: nextCity, addressLine: nextAddressLine }) => {
          setPostalCode(nextPostalCode);
          if (prefectures.includes(nextPrefecture as (typeof prefectures)[number])) {
            setPrefecture(nextPrefecture as (typeof prefectures)[number]);
          }
          setCity(nextCity);
          setAddressLine(nextAddressLine);
        }}
      />
      <div className="grid gap-3 sm:grid-cols-[0.7fr_0.8fr_0.9fr_1.2fr]">
        <input
          className="field"
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value)}
          inputMode="numeric"
          maxLength={8}
          placeholder="郵便番号"
        />
        <select
          className="field"
          value={prefecture}
          onChange={(event) => setPrefecture(event.target.value as (typeof prefectures)[number])}
        >
          {prefectures.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          className="field"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="市区町村"
          required
        />
        <input
          className="field"
          value={addressLine}
          onChange={(event) => setAddressLine(event.target.value)}
          placeholder="番地・建物名"
          required
        />
      </div>
      <textarea
        className="field min-h-40"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="説明"
        required
      />
      <input
        className="field"
        value={coverImageUrl}
        onChange={(event) => setCoverImageUrl(event.target.value)}
        placeholder="Storage の画像 URL または公開 URL"
      />
      <div className="rounded-[24px] bg-mist p-4">
        <label className="block text-sm font-semibold text-ink">カバー画像アップロード</label>
        <input
          className="mt-3 block w-full text-sm text-ink/70"
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          disabled={uploadingImage}
        />
        <p className="mt-2 text-sm text-ink/60">
          {uploadingImage ? "Storage にアップロード中です..." : "画像を選ぶと Storage に保存し、URL を自動入力します。"}
        </p>
        {coverImageUrl ? (
          <img
            alt="cover preview"
            className="mt-4 h-44 w-full rounded-[20px] object-cover"
            src={coverImageUrl}
          />
        ) : (
          <div className="mt-4 flex h-44 items-center justify-center rounded-[20px] border border-dashed border-ink/15 bg-white/70 text-sm text-ink/50">
            カバー画像プレビュー
          </div>
        )}
      </div>
      <label className="flex items-center gap-3 rounded-[20px] bg-mist px-4 py-3 text-sm text-ink/68">
        <input
          checked={isPublished}
          onChange={(event) => setIsPublished(event.target.checked)}
          type="checkbox"
        />
        公開状態にする
      </label>
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      <button type="submit" className="cta-primary" disabled={saving}>
        {saving ? "保存中..." : props.mode === "create" ? "SPOT を保存する" : "更新する"}
      </button>
    </form>
  );
}
