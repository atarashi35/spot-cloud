"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";
import { PostalCodeField } from "@/components/forms/postal-code-field";
import { useAuth } from "@/components/providers/auth-provider";
import {
  createSpotInFirestore,
  getSpotFromFirestore,
  updateSpotInFirestore
} from "@/lib/firestore/spots";
import { GalleryUploader } from "@/components/ui/gallery-uploader";
import { uploadSpotCoverImage } from "@/lib/storage/spots";
import { SpotCategory, TeamMember } from "@/lib/types";

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
  "ライブハウス・音楽",
  "劇場・パフォーマンス",
  "ミニシアター・映画館",
  "ギャラリー・アート",
  "伝統文化・芸能",
  "本屋・書店",
  "カフェ・バー",
  "文化プロジェクト",
  "その他"
];

// ─── SNS ハンドル ↔ URL 変換ヘルパー ──────────────────────────────────────

type SnsPlatform = "instagram" | "twitter" | "line" | "youtube";

/** 保存済み URL からハンドル部分を抽出して入力欄に表示する */
function extractHandle(url: string, platform: SnsPlatform): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    switch (platform) {
      case "instagram":
        // https://instagram.com/handle → "handle"
        return u.pathname.replace(/^\//, "").split("/")[0] ?? "";
      case "twitter":
        // https://x.com/handle or https://twitter.com/handle → "handle"
        return u.pathname.replace(/^\//, "").split("/")[0] ?? "";
      case "line":
        // https://line.me/R/ti/p/@id → "id"（@ を除去）
        return u.pathname.split("/").pop()?.replace(/^@/, "") ?? "";
      case "youtube":
        // https://youtube.com/@handle → "handle"（@ を除去）
        return u.pathname.replace(/^\//, "").replace(/^@/, "").split("/")[0] ?? "";
    }
  } catch {
    return "";
  }
}

// ─── SNS ハンドル入力コンポーネント ─────────────────────────────────────

function SnsHandleInput({
  label,
  prefix,
  handle,
  previewUrl,
  placeholder,
  onChange
}: {
  label: string;
  prefix: string;
  handle: string;
  previewUrl: string;
  placeholder: string;
  onChange: (handle: string) => void;
}) {
  function handleChange(raw: string) {
    // @ や空白を除去してハンドルだけ渡す
    const cleaned = raw.replace(/^[@\s]+/, "").trim();
    onChange(cleaned);
  }

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-3">
        <span className="w-36 shrink-0 text-xs font-medium text-ink/68">{label}</span>
        <div className="flex flex-1 items-center gap-1">
          <span className="text-sm text-ink/60">{prefix}</span>
          <input
            className="field flex-1 text-sm"
            value={handle}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      </label>
      {previewUrl ? (
        <p className="ml-[9.5rem] truncate text-[13px] text-ink/58">{previewUrl}</p>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────

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
  const [category, setCategory] = useState<SpotCategory>("ライブハウス・音楽");
  const [postalCode, setPostalCode] = useState("");
  const [prefecture, setPrefecture] = useState<(typeof prefectures)[number]>("東京都");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [line, setLine] = useState("");
  const [youtube, setYoutube] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(props.mode === "edit");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (authReady && !user) {
      setLoginModalOpen(true);
    }
  }, [authReady, user]);

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
        setGalleryImageUrls(spot.galleryImageUrls ?? []);
        setIsPublished(spot.isPublished);
        setPhone(spot.phone ?? "");
        setEmail(spot.email ?? "");
        setWebsite(spot.socialLinks?.website ?? "");
        setInstagram(spot.socialLinks?.instagram ?? "");
        setTwitter(spot.socialLinks?.twitter ?? "");
        setLine(spot.socialLinks?.line ?? "");
        setYoutube(spot.socialLinks?.youtube ?? "");
        setTeamMembers(spot.teamMembers ?? []);
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
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim();
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
            name, category, address: fullAddress, prefecture,
            city: normalizedCity, description, coverImageUrl, galleryImageUrls, isPublished,
            phone: normalizedPhone, email: normalizedEmail,
            socialLinks: { website, instagram, twitter, line, youtube },
            teamMembers: teamMembers.filter((m) => m.name.trim()),
          },
          user.uid
        );
        router.push(`/owner/spots/${spotId}/payout`);
        router.refresh();
        return;
      }

      await updateSpotInFirestore(props.spotId, {
        name, category, address: fullAddress, prefecture,
        city: normalizedCity, description, coverImageUrl, galleryImageUrls, isPublished,
        phone: normalizedPhone, email: normalizedEmail,
        socialLinks: { website, instagram, twitter, line, youtube },
        teamMembers: teamMembers.filter((m) => m.name.trim()),
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
    return <div className="panel px-6 py-8 text-sm text-ink/72">認証状態を確認中です。</div>;
  }

  if (!user) {
    return (
      <LoginModal
        open={loginModalOpen}
        onSuccess={() => setLoginModalOpen(false)}
        onClose={() => {
          setLoginModalOpen(false);
          router.push("/owner");
        }}
      />
    );
  }

  if (loading) {
    return <div className="panel px-6 py-8 text-sm text-ink/72">SPOT 情報を読み込み中です。</div>;
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <div>
        <input
          className="field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="SPOT名"
          required
          aria-invalid={!!error && !name.trim() ? true : undefined}
        />
        <p className="mt-1.5 text-xs text-ink/65">※場所・屋号・団体名・プロジェクト名など</p>
      </div>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="field"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="電話番号（任意）"
        />
        <input
          className="field"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="メールアドレス（任意）"
        />
      </div>
      <div className="rounded-[20px] bg-mist p-4">
        <label className="block text-sm font-semibold text-ink">カバー画像アップロード</label>
        <input
          className="mt-3 block w-full text-sm text-ink/78"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          disabled={uploadingImage}
        />
        <p className="mt-2 text-sm text-ink/72">
          {uploadingImage ? "Storage にアップロード中です..." : "PNG / JPEG / WebP を Storage に保存し、そのままカバー画像に設定します。"}
        </p>
        {coverImageUrl ? (
          <img
            alt="cover preview"
            className="mt-4 h-44 w-full rounded-[20px] object-cover"
            src={coverImageUrl}
          />
        ) : (
          <div className="mt-4 flex h-44 items-center justify-center rounded-[20px] border border-dashed border-ink/15 bg-white/70 text-sm text-ink/65">
            カバー画像プレビュー
          </div>
        )}
      </div>
      {/* ギャラリー */}
      <div className="space-y-3 rounded-[20px] bg-mist p-4">
        <div>
          <label className="block text-sm font-semibold text-ink">ギャラリー</label>
          <p className="mt-0.5 text-xs text-ink/65">活動の雰囲気が伝わる写真を最大10枚まで追加できます</p>
        </div>
        <GalleryUploader
          values={galleryImageUrls}
          onChange={setGalleryImageUrls}
          storagePath={props.mode === "edit" ? `spots/${props.spotId}/gallery` : "spots/new/gallery"}
        />
      </div>

      {/* SNS リンク */}
      <div className="space-y-4 rounded-[20px] border border-ink/10 p-4">
        <p className="text-sm font-bold text-ink/72">SNS・外部リンク（任意）</p>

        {/* ウェブサイト：URL直打ち */}
        <div className="space-y-1">
          <label className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-xs font-medium text-ink/68">ウェブサイト</span>
            <input
              className="field text-sm"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </label>
        </div>

        {/* Instagram */}
        <SnsHandleInput
          label="Instagram"
          prefix="@"
          handle={extractHandle(instagram, "instagram")}
          previewUrl={instagram}
          placeholder="ユーザー名"
          onChange={(h) => setInstagram(h ? `https://instagram.com/${h}` : "")}
        />

        {/* X (Twitter) */}
        <SnsHandleInput
          label="X (Twitter)"
          prefix="@"
          handle={extractHandle(twitter, "twitter")}
          previewUrl={twitter}
          placeholder="ユーザー名"
          onChange={(h) => setTwitter(h ? `https://x.com/${h}` : "")}
        />

        {/* LINE */}
        <SnsHandleInput
          label="LINE 公式"
          prefix="@"
          handle={extractHandle(line, "line")}
          previewUrl={line}
          placeholder="LINE ID（例: abc1234）"
          onChange={(h) => setLine(h ? `https://line.me/R/ti/p/@${h}` : "")}
        />

        {/* YouTube */}
        <SnsHandleInput
          label="YouTube"
          prefix="@"
          handle={extractHandle(youtube, "youtube")}
          previewUrl={youtube}
          placeholder="チャンネル名"
          onChange={(h) => setYoutube(h ? `https://youtube.com/@${h}` : "")}
        />
      </div>

      {/* 運営メンバー */}
      <div className="space-y-3 rounded-[20px] border border-ink/10 p-4">
        <div>
          <p className="text-sm font-bold text-ink/72">運営メンバー（任意）</p>
          <p className="mt-1 text-xs leading-5 text-ink/60">
            このSPOTを動かしているメンバーを紹介できます。支援者が「誰がやっているか」を知るための情報です。
          </p>
        </div>
        {teamMembers.map((member, index) => (
          <div key={index} className="space-y-2 rounded-[16px] bg-white/70 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="field text-sm"
                value={member.name}
                onChange={(e) => setTeamMembers((prev) => prev.map((m, i) => i === index ? { ...m, name: e.target.value } : m))}
                placeholder="名前（例：田中 太郎）"
              />
              <input
                className="field text-sm"
                value={member.role}
                onChange={(e) => setTeamMembers((prev) => prev.map((m, i) => i === index ? { ...m, role: e.target.value } : m))}
                placeholder="役割（例：代表、指導教員、学生メンバー）"
              />
            </div>
            <div className="flex gap-2">
              <input
                className="field flex-1 text-sm"
                value={member.bio ?? ""}
                onChange={(e) => setTeamMembers((prev) => prev.map((m, i) => i === index ? { ...m, bio: e.target.value } : m))}
                placeholder="一言紹介（任意）"
                maxLength={60}
              />
              <button
                type="button"
                className="shrink-0 rounded-full px-3 py-1.5 text-xs text-ink/60 hover:bg-ink/8 hover:text-ink"
                onClick={() => setTeamMembers((prev) => prev.filter((_, i) => i !== index))}
              >
                削除
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="w-full rounded-[16px] border border-dashed border-ink/20 py-2.5 text-sm text-ink/65 hover:border-ink/40 hover:text-ink/78 transition-colors"
          onClick={() => setTeamMembers((prev) => [...prev, { name: "", role: "", bio: "" }])}
        >
          ＋ メンバーを追加
        </button>
      </div>

      <label className="flex items-center gap-3 rounded-[20px] bg-mist px-4 py-3 text-sm text-ink/78">
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
