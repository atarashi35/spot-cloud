"use client";

import { ChevronDown, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { SpotCard } from "@/components/spot-card";
import { PageShell } from "@/components/ui/page-shell";
import { listPublishedSpotsFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotCategory } from "@/lib/types";

const categoryOptions: Array<{ value: "all" | SpotCategory; label: string }> = [
  { value: "all", label: "すべてのカテゴリ" },
  { value: "カフェ", label: "カフェ" },
  { value: "スポーツ", label: "スポーツ" },
  { value: "文化施設", label: "文化施設" },
  { value: "市民団体", label: "市民団体" },
  { value: "商店街", label: "商店街" },
  { value: "クリエイター", label: "クリエイター" },
  { value: "アート", label: "アート" },
  { value: "寺社仏閣", label: "寺社仏閣" },
  { value: "自治会", label: "自治会" },
  { value: "その他", label: "その他" }
];

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("ja-JP");
}

function FilterSelect({
  value,
  options,
  onChange
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const active = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`filter-select-button ${open ? "filter-select-button-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{active?.label ?? ""}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink/45 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="filter-dropdown" role="listbox">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`filter-dropdown-item ${selected ? "filter-dropdown-item-selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
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

  const prefectureFilterOptions = useMemo(
    () => [
      { value: "all", label: "都道府県" },
      ...prefectureOptions.map((item) => ({ value: item, label: item }))
    ],
    [prefectureOptions]
  );

  const cityFilterOptions = useMemo(
    () => [
      { value: "all", label: "市区町村" },
      ...cityOptions.map((item) => ({ value: item, label: item }))
    ],
    [cityOptions]
  );

  const categoryFilterOptions = useMemo(
    () => categoryOptions.map((item) => ({ value: item.value, label: item.label })),
    []
  );

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
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">あなたのSPOTを支える</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/62">
            SPOTは、あなたの好きな場所やコミュニティを、ソシオとしてゆるく支えられる会員型サービスです。
          </p>
        </div>

        <div className="search-panel">
          <div className="search-panel-header">
            <div className="text-[11px] font-semibold tracking-[0.22em] text-ink/40">FILTER SPOTS</div>
            <div className="search-result-pill">
              {spots ? `${filteredSpots.length} SPOTS` : "LOADING"}
            </div>
          </div>

          <div className="search-toolbar">
            <label className="search-shell search-shell-compact">
              <span className="search-icon-badge search-icon-badge-compact">
                <Search className="h-4 w-4" />
              </span>
              <input
                className="search-input"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="SPOT名、説明、住所で探す"
              />
            </label>

            <label className="filter-shell filter-shell-compact filter-shell-prefecture">
              <FilterSelect
                value={prefecture}
                options={prefectureFilterOptions}
                onChange={(nextValue) => {
                  setPrefecture(nextValue);
                  setCity("all");
                }}
              />
            </label>
            <label className="filter-shell filter-shell-compact filter-shell-city">
              <FilterSelect
                value={city}
                options={cityFilterOptions}
                onChange={setCity}
              />
            </label>
            <label className="filter-shell filter-shell-compact filter-shell-category">
              <FilterSelect
                value={category}
                options={categoryFilterOptions}
                onChange={(nextValue) => setCategory(nextValue as "all" | SpotCategory)}
              />
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
        <section className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel overflow-hidden animate-pulse">
              <div className="h-44 w-full bg-mist" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-16 rounded-full bg-mist" />
                <div className="h-5 w-3/4 rounded-full bg-mist" />
                <div className="h-3 w-full rounded-full bg-mist" />
                <div className="h-3 w-2/3 rounded-full bg-mist" />
              </div>
            </div>
          ))}
        </section>
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

      <div className="border-t border-ink/8 pt-6 text-center">
        <p className="text-sm text-ink/55">
          カフェ・サークル・地域活動など、あなたのSPOTを作りませんか？
        </p>
        <a href="/owner" className="mt-2 inline-block text-sm font-semibold text-moss hover:underline">
          SPOTを登録する →
        </a>
      </div>
    </PageShell>
  );
}
