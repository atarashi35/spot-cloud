"use client";

import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { SpotCard } from "@/components/spot-card";
import { PageShell } from "@/components/ui/page-shell";
import { listPublishedSpotsFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotCategory } from "@/lib/types";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const categoryOptions: Array<{ value: "all" | SpotCategory; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "本屋・書店", label: "本屋・書店" },
  { value: "ミニシアター・映画館", label: "ミニシアター・映画館" },
  { value: "ライブハウス・音楽", label: "ライブハウス・音楽" },
  { value: "劇場・パフォーマンス", label: "劇場・パフォーマンス" },
  { value: "ギャラリー・アート", label: "ギャラリー・アート" },
  { value: "神社・寺院", label: "神社・寺院" },
  { value: "その他", label: "その他" },
];

type SortOption = "recommended" | "popular" | "newest";

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "recommended", label: "おすすめ" },
  { value: "popular", label: "人気順" },
  { value: "newest", label: "新着順" },
];

function sortSpotList(list: Spot[], sort: SortOption) {
  if (sort === "recommended") return list;
  return [...list].sort((left, right) =>
    sort === "popular"
      ? right.socioCount - left.socioCount
      : right.createdAt.localeCompare(left.createdAt)
  );
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("ja-JP");
}

function FilterSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const active = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((c) => !c)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-ink/12 bg-white px-4 py-3 text-sm font-medium text-ink/72 transition hover:border-ink/20 hover:text-ink/80"
      >
        <span className="truncate">{placeholder && value === "all" ? placeholder : (active?.label ?? "")}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink/58 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-full overflow-hidden rounded-[20px] border border-white/80 bg-white/95 p-1.5 shadow-[0_24px_54px_rgba(19,35,28,0.14)] backdrop-blur" role="listbox">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`flex w-full items-center whitespace-nowrap rounded-[14px] px-3 py-2.5 text-left text-sm font-medium transition hover:bg-mist ${selected ? "bg-mist text-ink" : "text-ink/68 hover:text-ink/78"}`}
                onClick={() => { onChange(option.value); setOpen(false); }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SpotListPage() {
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [prefecture, setPrefecture] = useState("all");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState<"all" | SpotCategory>("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const gridRef = useScrollReveal<HTMLDivElement>({ staggerChildren: true, staggerDelay: 60 });
  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    void listPublishedSpotsFromFirestore()
      .then(setSpots)
      .catch((cause: Error) => setError(cause.message));
  }, []);

  const prefectureOptions = useMemo(() => {
    if (!spots) return [];
    return Array.from(new Set(spots.map((s) => s.prefecture).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
  }, [spots]);

  const cityOptions = useMemo(() => {
    if (!spots) return [];
    const source = prefecture === "all" ? spots : spots.filter((s) => s.prefecture === prefecture);
    return Array.from(new Set(source.map((s) => s.city).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "ja")
    );
  }, [prefecture, spots]);

  const prefectureFilterOptions = useMemo(
    () => [{ value: "all", label: "都道府県" }, ...prefectureOptions.map((v) => ({ value: v, label: v }))],
    [prefectureOptions]
  );

  const cityFilterOptions = useMemo(
    () => [{ value: "all", label: "市区町村" }, ...cityOptions.map((v) => ({ value: v, label: v }))],
    [cityOptions]
  );

  const filteredSpots = useMemo(() => {
    if (!spots) return [];
    const normalized = normalizeText(deferredKeyword);
    return spots.filter((spot) => {
      const matchesKeyword =
        normalized.length === 0 ||
        [spot.name, spot.description, spot.address, spot.city, spot.prefecture]
          .join(" ")
          .toLocaleLowerCase("ja-JP")
          .includes(normalized);
      return (
        matchesKeyword &&
        (prefecture === "all" || spot.prefecture === prefecture) &&
        (city === "all" || spot.city === city) &&
        (category === "all" || spot.category === category)
      );
    });
  }, [spots, deferredKeyword, prefecture, city, category]);

  const sortedSpots = useMemo(() => sortSpotList(filteredSpots, sort), [filteredSpots, sort]);

  const activeFilterCount = [prefecture !== "all", city !== "all"].filter(Boolean).length;

  return (
    <div className="pb-20">

      {/* ── ページヘッダー ── */}
      <div className="border-b border-ink/8 bg-white/70 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-sm font-bold text-ink/72">SPOT MAP</div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            SPOTを探す
          </h1>
          <p className="mt-2 text-sm text-ink/68">
            気になる活動を見つけて、月300円から応援会員になろう。
          </p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <PageShell className="mt-6">
        <label className="flex items-center gap-3 rounded-[22px] border border-ink/10 bg-white px-4 py-3.5 shadow-[0_4px_20px_rgba(19,35,28,0.07)] transition focus-within:border-moss focus-within:shadow-[0_4px_24px_rgba(19,35,28,0.10)]">
          <Search className="h-5 w-5 shrink-0 text-ink/60" />
          <input
            className="w-full border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/58"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="SPOT名、住所、エリアで探す..."
          />
          {keyword ? (
            <button type="button" onClick={() => setKeyword("")} className="shrink-0 rounded-full p-0.5 text-ink/58 transition hover:text-ink/72">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>
      </PageShell>

      {/* ── Category chips ── */}
      <PageShell className="mt-4 overflow-x-auto pb-1 hide-scrollbar">
        <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
          {categoryOptions.map((cat) => {
            const active = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value as "all" | SpotCategory)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-[0.95] ${
                  active
                    ? "bg-ink text-white shadow-sm"
                    : "border border-ink/12 bg-white text-ink/70 hover:border-ink/22 hover:text-ink/80"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </PageShell>

      {/* ── Filter bar ── */}
      <PageShell className="mt-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAreaFilter((c) => !c)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition active:scale-[0.96] ${
                showAreaFilter || activeFilterCount > 0
                  ? "border-moss bg-moss/8 text-moss"
                  : "border-ink/12 bg-white text-ink/65 hover:border-ink/22 hover:text-ink/78"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              エリア
              {activeFilterCount > 0 ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-moss text-xs font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <div className="flex items-center gap-1.5">
              {sortOptions.map((option) => {
                const active = sort === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSort(option.value)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition active:scale-[0.96] ${
                      active
                        ? "border-ink bg-ink text-white shadow-sm"
                        : "border-ink/12 bg-white text-ink/65 hover:border-ink/22 hover:text-ink/78"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="text-sm font-bold text-ink/72">
            {spots ? `${filteredSpots.length} SPOTS` : "···"}
          </div>
        </div>

        {showAreaFilter ? (
          <div className="mt-3 flex gap-3 px-1">
            <FilterSelect
              value={prefecture}
              options={prefectureFilterOptions}
              onChange={(v) => { setPrefecture(v); setCity("all"); }}
              placeholder="都道府県"
            />
            <FilterSelect
              value={city}
              options={cityFilterOptions}
              onChange={setCity}
              placeholder="市区町村"
            />
          </div>
        ) : null}
      </PageShell>

      {/* ── Results ── */}
      <PageShell className="mt-5">
        {error ? (
          <EmptyState
            title="SPOT 一覧を取得できませんでした"
            description={`Firestore 接続でエラーが出ています: ${error}`}
          />
        ) : !spots ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="panel overflow-hidden animate-pulse">
                <div className="h-48 w-full bg-mist" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-16 rounded-full bg-mist" />
                  <div className="h-5 w-3/4 rounded-full bg-mist" />
                  <div className="h-3 w-full rounded-full bg-mist" />
                  <div className="h-3 w-2/3 rounded-full bg-mist" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSpots.length === 0 ? (
          <EmptyState
            title="条件に合うSPOTが見つかりません"
            description="キーワード、カテゴリ、エリアの条件をゆるめてもう一度お試しください。"
          />
        ) : (
          <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        )}
      </PageShell>

      {/* ── Owner CTA ── */}
      <PageShell className="mt-10">
        <div className="rounded-[28px] border border-dashed border-ink/15 bg-white/60 px-6 py-8 text-center">
          <div className="text-sm font-bold text-ink/72">FOR OWNERS</div>
          <p className="mt-2 text-base font-bold text-ink">あなたの場所にも、応援会員を。</p>
          <p className="mt-1.5 text-[13px] leading-[1.7] text-ink/68">
            月300円から、常連さんが店を続ける力になります。初期費用・月額費用は0円。
          </p>
          <Link href="/" className="cta-primary mt-5 inline-flex">
            SPOTを作る
          </Link>
        </div>
      </PageShell>
    </div>
  );
}
