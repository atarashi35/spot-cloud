"use client";

import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { SpotCard } from "@/components/spot-card";
import { PageShell } from "@/components/ui/page-shell";
import { listPublishedSpotsFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotCategory } from "@/lib/types";

const categoryOptions: Array<{ value: "all" | SpotCategory; label: string }> = [
  { value: "all", label: "すべてのカテゴリ" },
  { value: "カフェ", label: "カフェ" },
  { value: "神社", label: "神社" },
  { value: "アート", label: "アート" },
  { value: "文化施設", label: "文化施設" },
  { value: "市民団体", label: "市民団体" },
  { value: "スポーツ", label: "スポーツ" },
  { value: "商店街", label: "商店街" },
  { value: "自治会", label: "自治会" },
  { value: "クリエイター", label: "クリエイター" },
  { value: "その他", label: "その他" }
];

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("ja-JP");
}

export function SpotMapPage() {
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [prefecture, setPrefecture] = useState("all");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState<"all" | SpotCategory>("all");
  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    void listPublishedSpotsFromFirestore()
      .then((nextSpots) => {
        setSpots(nextSpots);
      })
      .catch((cause: Error) => {
        setError(cause.message);
      });
  }, []);

  const prefectureOptions = useMemo(() => {
    if (!spots) {
      return [];
    }

    return Array.from(new Set(spots.map((spot) => spot.prefecture).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
  }, [spots]);

  const cityOptions = useMemo(() => {
    if (!spots) {
      return [];
    }

    const source = prefecture === "all" ? spots : spots.filter((spot) => spot.prefecture === prefecture);
    return Array.from(new Set(source.map((spot) => spot.city).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
  }, [prefecture, spots]);

  const filteredSpots = useMemo(() => {
    if (!spots) {
      return [];
    }

    const normalizedKeyword = normalizeText(deferredKeyword);

    return spots.filter((spot) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        [
          spot.name,
          spot.description,
          spot.address,
          spot.city,
          spot.prefecture
        ]
          .join(" ")
          .toLocaleLowerCase("ja-JP")
          .includes(normalizedKeyword);

      const matchesPrefecture = prefecture === "all" || spot.prefecture === prefecture;
      const matchesCity = city === "all" || spot.city === city;
      const matchesCategory = category === "all" || spot.category === category;

      return matchesKeyword && matchesPrefecture && matchesCity && matchesCategory;
    });
  }, [spots, deferredKeyword, prefecture, city, category]);

  return (
    <PageShell className="space-y-6">
      <section className="space-y-5 px-1">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.22em] text-ink/42">SPOT MAP</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">好きなSPOTを見つける</h1>
        </div>

        <div className="search-panel">
          <label className="search-shell">
            <Search className="h-4 w-4 shrink-0 text-ink/35" />
            <input
              className="search-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="SPOT名、説明、住所で探す"
            />
          </label>

          <div className="search-filters">
            <label className="filter-shell">
              <select
                className="filter-select"
                value={prefecture}
                onChange={(event) => {
                  setPrefecture(event.target.value);
                  setCity("all");
                }}
              >
                <option value="all">都道府県を選ぶ</option>
                {prefectureOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-shell">
              <select
                className="filter-select"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              >
                <option value="all">市区町村を選ぶ</option>
                {cityOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-shell">
            <select
              className="filter-select"
              value={category}
              onChange={(event) => setCategory(event.target.value as "all" | SpotCategory)}
            >
              {categoryOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          </div>
        </div>
      </section>

      {error ? (
        <EmptyState
          title="SPOT 一覧を取得できませんでした"
          description={`Firestore 接続でエラーが出ています: ${error}`}
        />
      ) : !spots ? (
        <div className="panel px-6 py-8 text-sm text-ink/60">SPOT を読み込み中です。</div>
      ) : filteredSpots.length === 0 ? (
        <EmptyState
          title="条件に合うSPOTが見つかりません"
          description="キーワード、エリア、カテゴリの条件をゆるめてもう一度探してください。"
        />
      ) : (
        <section className="grid gap-5 lg:grid-cols-3">
          {filteredSpots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </section>
      )}
    </PageShell>
  );
}
