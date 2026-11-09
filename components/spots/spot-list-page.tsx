"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { SpotCard } from "@/components/spot-card";
import { listPublishedSpotsFromFirestore } from "@/lib/firestore/spots";
import type { Spot, SpotKind } from "@/lib/types";

export function SpotListPage() {
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [error, setError] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [kind, setKind] = useState<"all" | SpotKind>("all");
  const [category, setCategory] = useState("all");
  const [prefecture, setPrefecture] = useState("all");
  const [city, setCity] = useState("all");
  const [booking, setBooking] = useState(false);
  const [budget, setBudget] = useState("all");
  const [sort, setSort] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const deferredKeyword = useDeferredValue(keyword);
  useEffect(() => { void listPublishedSpotsFromFirestore().then(setSpots).catch(() => setError(true)); }, []);
  const candidates = useMemo(() => (spots ?? []).filter((spot) => kind === "all" || spot.kind === kind), [spots, kind]);
  const categories = useMemo(() => [...new Set(candidates.map((spot) => spot.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja")), [candidates]);
  const areas = useMemo(() => [...new Set(candidates.map((spot) => spot.prefecture).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja")), [candidates]);
  const cities = useMemo(() => [...new Set(candidates.filter((spot) => prefecture === "all" || spot.prefecture === prefecture).map((spot) => spot.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja")), [candidates, prefecture]);
  const filtered = useMemo(() => {
    const term = deferredKeyword.trim().toLocaleLowerCase("ja-JP");
    return candidates.filter((spot) => {
      const accepts = Boolean(spot.performerFee) && spot.bookingsEnabled !== false;
      return (!term || [spot.name, spot.description, spot.prefecture, spot.city, spot.address, ...(spot.activityFields ?? []), ...(spot.performerDisciplines ?? [])].join(" ").toLocaleLowerCase("ja-JP").includes(term))
        && (category === "all" || spot.category === category)
        && (prefecture === "all" || spot.prefecture === prefecture)
        && (city === "all" || spot.city === city)
        && (!booking || accepts)
        && (budget === "all" || (accepts && (spot.performerFee ?? 0) <= Number(budget)));
    }).sort((a, b) => sort === "popular" ? (b.socioCount + (b.followerCount ?? 0)) - (a.socioCount + (a.followerCount ?? 0)) : sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : b.updatedAt.localeCompare(a.updatedAt));
  }, [candidates, deferredKeyword, category, prefecture, city, booking, budget, sort]);
  const filterCount = [category !== "all", prefecture !== "all", city !== "all", booking, budget !== "all"].filter(Boolean).length;
  return <main className="shell mx-auto max-w-6xl space-y-6 pb-20 pt-8">
    <h1 className="text-3xl font-bold text-ink">SPOTを探す</h1>
    <label className="flex items-center gap-3 rounded-xl border border-ink/15 bg-white px-4 py-3">
      <Search className="h-5 w-5 shrink-0 text-ink/55" /><span className="sr-only">名前や活動分野で検索</span>
      <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="名前・活動分野・地域" className="w-full bg-transparent text-sm outline-none" />
    </label>
    <div className="flex items-center justify-between gap-3 border-b border-ink/10">
      <div className="flex min-w-0 gap-4 overflow-x-auto" aria-label="SPOTの種類">
        {([{ value: "all", label: "すべて" }, { value: "creator", label: "クリエイター" }, { value: "organization", label: "団体" }] as const).map((option) => <button type="button" key={option.value} aria-pressed={kind === option.value} onClick={() => { setKind(option.value); setCategory("all"); setPrefecture("all"); setCity("all"); }} className={`whitespace-nowrap border-b-2 pb-3 text-sm font-semibold ${kind === option.value ? "border-moss text-ink" : "border-transparent text-ink/55"}`}>{option.label}</button>)}
      </div>
      <button type="button" aria-label={`絞り込み${filterCount ? ` (${filterCount})` : ""}`} aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)} className="flex min-h-11 shrink-0 items-center gap-1 px-2 pb-3 text-sm text-ink/70"><SlidersHorizontal className="h-5 w-5" /><span className="hidden sm:inline">絞り込み</span>{filterCount ? ` (${filterCount})` : ""}</button>
    </div>
    {showFilters ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs text-ink/65">活動分野<select className="field mt-1" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">すべて</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="text-xs text-ink/65">都道府県<select className="field mt-1" value={prefecture} onChange={(e) => { setPrefecture(e.target.value); setCity("all"); }}><option value="all">すべて</option>{areas.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="text-xs text-ink/65">市区町村<select className="field mt-1" value={city} onChange={(e) => setCity(e.target.value)}><option value="all">すべて</option>{cities.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="text-xs text-ink/65">出演依頼の予算<select className="field mt-1" value={budget} onChange={(e) => setBudget(e.target.value)}><option value="all">指定なし</option><option value="10000">〜1万円</option><option value="30000">〜3万円</option><option value="100000">〜10万円</option></select></label>
      <label className="flex items-center gap-2 self-end py-3 text-sm"><input type="checkbox" checked={booking} onChange={(e) => setBooking(e.target.checked)} />出演依頼受付中</label>
    </div> : null}
    <div className="flex items-center justify-between gap-4 text-sm text-ink/60"><span>{spots ? `${filtered.length}件` : "読み込み中"}</span><label>並び順 <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent text-ink"><option value="recent">更新順</option><option value="newest">新着順</option><option value="popular">サポーター数順</option></select></label></div>
    {error ? <p className="text-sm text-red-700">SPOTを読み込めませんでした。再読み込みしてください。</p> : !spots ? <p className="text-sm text-ink/60">読み込み中です。</p> : filtered.length === 0 ? <p className="py-8 text-sm text-ink/60">条件に合うSPOTが見つかりません。</p> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((spot) => <SpotCard key={spot.id} spot={spot} />)}</div>}
  </main>;
}
