"use client";

import { ChevronDown, Download, PencilLine } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { SpotMembership } from "@/lib/types";

type StatusFilter = "paying" | "all";

const STATUS_LABEL: Record<SpotMembership["status"], string> = {
  active: "利用中",
  canceling: "解約予定",
  past_due: "支払い確認待ち",
  canceled: "解約済み"
};

const STATUS_TONE: Record<SpotMembership["status"], "success" | "warning" | "neutral"> = {
  active: "success",
  canceling: "warning",
  past_due: "warning",
  canceled: "neutral"
};

function exportCsv(members: SpotMembership[], spotName: string) {
  const header = ["お名前", "所属", "メール", "プラン", "ステータス", "年齢", "性別", "加入日"];
  const rows = members.map((m) => [
    m.displayName,
    m.affiliation ?? "",
    m.email,
    `¥${m.planAmount}`,
    STATUS_LABEL[m.status],
    m.ageRange ?? "",
    m.gender ?? "",
    m.joinedAt.slice(0, 10)
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${spotName}_socios_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SocioListPanel({ spotId, spotName, defaultOpen = false }: { spotId: string; spotName: string; defaultOpen?: boolean }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<SpotMembership[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("paying");
  const [open, setOpen] = useState(defaultOpen);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [draftAffiliation, setDraftAffiliation] = useState("");
  const [savingUid, setSavingUid] = useState<string | null>(null);

  // アコーディオンを開いた時だけ取得（遅延ロード）
  useEffect(() => {
    if (!open || !user || members !== null) return;

    setLoading(true);
    void user.getIdToken().then(async (token) => {
      try {
        const res = await fetch(`/api/spots/${spotId}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = (await res.json()) as { members?: SpotMembership[]; message?: string };
        if (!res.ok) throw new Error(data.message ?? "取得に失敗しました");
        setMembers(data.members ?? []);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "取得に失敗しました");
      } finally {
        setLoading(false);
      }
    });
  }, [open, user, spotId, members]);

  const displayed = members
    ? filter === "paying"
      ? members.filter((m) => m.status === "active" || m.status === "canceling")
      : members
    : [];

  const payingCount = members?.filter(
    (m) => m.status === "active" || m.status === "canceling"
  ).length ?? 0;

  async function saveAffiliation(uid: string) {
    if (!user || !members) return;

    setSavingUid(uid);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${spotId}/members`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          uid,
          affiliation: draftAffiliation
        })
      });

      const data = (await response.json()) as { affiliation?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "所属を更新できませんでした。");
      }

      setMembers((current) =>
        current?.map((member) =>
          member.uid === uid ? { ...member, affiliation: data.affiliation ?? "" } : member
        ) ?? current
      );
      setEditingUid(null);
      setDraftAffiliation("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "所属を更新できませんでした。");
    } finally {
      setSavingUid(null);
    }
  }

  return (
    <div className="mt-4 rounded-[16px] border border-ink/10 bg-white">
      {/* ヘッダー（トグル） */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-[0.18em] text-ink/55">ソシオ一覧</span>
          {members !== null ? (
            <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-ink/70">
              {payingCount}人
            </span>
          ) : null}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-ink/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="border-t border-ink/8 px-5 pb-5 pt-4">
          {/* フィルター + CSV */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex rounded-full border border-ink/10 p-0.5 text-xs">
              {(["paying", "all"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 transition ${
                    filter === f
                      ? "bg-ink text-white"
                      : "text-ink/55 hover:text-ink"
                  }`}
                >
                  {f === "paying" ? "加入中" : "全員"}
                </button>
              ))}
            </div>
            {members && members.length > 0 ? (
              <button
                type="button"
                onClick={() => exportCsv(filter === "paying" ? displayed : members, spotName)}
                className="flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink transition"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            ) : null}
          </div>

          {/* リスト本体 */}
          <div className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-[16px] bg-mist" />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-red-700">{error}</p>
            ) : displayed.length === 0 ? (
              <p className="text-sm text-ink/50">
                {filter === "paying" ? "現在加入中のソシオはいません。" : "まだソシオはいません。"}
              </p>
            ) : (
              <div className="space-y-2">
                {displayed.map((m) => (
                  <div key={m.uid} className="rounded-[16px] bg-mist px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-ink text-sm truncate">
                          {m.displayName || "(名前未設定)"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/55">
                          <span className="truncate">{m.email}</span>
                          {editingUid === m.uid ? null : (
                            <>
                              <span className="text-ink/25">/</span>
                              <span>{m.affiliation?.trim() ? `所属: ${m.affiliation}` : "所属未設定"}</span>
                            </>
                          )}
                        </div>
                        {editingUid === m.uid ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <input
                              className="field h-10 min-w-[220px] flex-1 bg-white"
                              value={draftAffiliation}
                              onChange={(e) => setDraftAffiliation(e.target.value)}
                              placeholder="所属を入力"
                            />
                            <button
                              type="button"
                              className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={() => void saveAffiliation(m.uid)}
                              disabled={savingUid === m.uid}
                            >
                              {savingUid === m.uid ? "保存中..." : "保存"}
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/60 transition hover:text-ink"
                              onClick={() => {
                                setEditingUid(null);
                                setDraftAffiliation("");
                              }}
                              disabled={savingUid === m.uid}
                            >
                              キャンセル
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {editingUid !== m.uid ? (
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1 text-[11px] font-semibold text-ink/55 transition hover:text-ink"
                            onClick={() => {
                              setEditingUid(m.uid);
                              setDraftAffiliation(m.affiliation ?? "");
                            }}
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            所属編集
                          </button>
                        ) : null}
                        <span className="text-xs font-semibold text-ink/70">¥{m.planAmount}</span>
                        <StatusBadge tone={STATUS_TONE[m.status]}>
                          {STATUS_LABEL[m.status]}
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-ink/45">
                      {m.ageRange ? <span>{m.ageRange}</span> : null}
                      {m.gender ? <span>{m.gender}</span> : null}
                      <span>加入 {m.joinedAt.slice(0, 10)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
