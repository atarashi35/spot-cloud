"use client";

import { useState } from "react";

type ZipCloudResult = {
  zipcode: string;
  address1: string;
  address2: string;
  address3: string;
};

type ZipCloudResponse = {
  message: string | null;
  results: ZipCloudResult[] | null;
  status: number;
};

export function PostalCodeField({
  onResolved
}: {
  onResolved: (payload: {
    postalCode: string;
    prefecture: string;
    city: string;
    addressLine: string;
  }) => void;
}) {
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLookup() {
    const normalized = postalCode.replace(/[^\d]/g, "");

    if (normalized.length !== 7) {
      setMessage("郵便番号は7桁で入力してください。");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalized}`);
      const data = (await response.json()) as ZipCloudResponse;

      if (!response.ok || !data.results?.length) {
        throw new Error(data.message ?? "住所を取得できませんでした。");
      }

      const result = data.results[0];
      onResolved({
        postalCode: normalized,
        prefecture: result.address1,
        city: result.address2,
        addressLine: result.address3
      });
      setPostalCode(normalized);
      setMessage("住所を反映しました。");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "住所を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[20px] bg-mist p-4">
      <div className="text-sm font-semibold text-ink">郵便番号から入力</div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          className="field"
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value)}
          inputMode="numeric"
          maxLength={8}
          placeholder="1234567"
        />
        <button type="button" className="cta-secondary sm:min-w-36" onClick={handleLookup} disabled={loading}>
          {loading ? "検索中..." : "住所を反映"}
        </button>
      </div>
      <p className="mt-2 text-sm text-ink/60">
        郵便番号から都道府県と市区町村を補助入力します。番地は必要に応じて調整してください。
      </p>
      {message ? <p className="mt-2 text-sm text-ink/68">{message}</p> : null}
    </div>
  );
}
