"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";
import { createVote } from "@/lib/firestore/votes";
import { PollOption, VoteType } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function VoteForm({
  spotId,
  createdBy,
  open,
  onClose,
  onCreated,
}: {
  spotId: string;
  createdBy: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<VoteType>("poll");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [options, setOptions] = useState<PollOption[]>([
    { id: uid(), text: "" },
    { id: uid(), text: "" },
  ]);
  const [deadlineDate, setDeadlineDate] = useState(""); // YYYY-MM-DD
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addOption() {
    setOptions((prev) => [...prev, { id: uid(), text: "" }]);
  }
  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }
  function updateOption(id: string, text: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    if (type === "poll") {
      const filled = options.filter((o) => o.text.trim());
      if (filled.length < 2) { setError("選択肢を2つ以上入力してください"); return; }
    }

    setSubmitting(true);
    try {
      await createVote(spotId, {
        type,
        title: title.trim(),
        body: body.trim(),
        options: type === "poll" ? options.filter((o) => o.text.trim()) : [],
        deadline: deadlineDate ? new Date(deadlineDate).toISOString() : undefined,
        createdBy,
      });
      setTitle(""); setBody(""); setDeadlineDate(""); setOptions([{ id: uid(), text: "" }, { id: uid(), text: "" }]);
      onCreated();
      onClose();
    } catch {
      setError("作成に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="みんなの声を作成">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 種別 */}
        <div className="flex gap-2">
          {(["poll", "open_question"] as VoteType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-[16px] border py-2.5 text-sm font-semibold transition ${
                type === t ? "border-ink bg-ink text-white" : "border-ink/12 bg-white text-ink/68 hover:border-ink/25"
              }`}
            >
              {t === "poll" ? "アンケート" : "意見募集"}
            </button>
          ))}
        </div>

        {/* タイトル */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink/68">タイトル</label>
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "poll" ? "例：次回イベントの開催日はどちらがいいですか？" : "例：新メニューへのご意見をお聞かせください"}
          />
        </div>

        {/* 補足説明 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink/68">補足説明（任意）</label>
          <textarea
            className="field resize-none"
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="詳細や背景を書くとサポーターに伝わりやすいです"
          />
        </div>

        {/* 選択肢（アンケートのみ） */}
        {type === "poll" && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink/68">選択肢</label>
            {options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  className="field"
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  placeholder={`選択肢 ${i + 1}`}
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(opt.id)} className="shrink-0 rounded-full p-2 text-ink/58 hover:bg-mist hover:text-ink/72">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-xs font-semibold text-ink/65 hover:text-ink/75">
                <Plus className="h-3.5 w-3.5" />
                選択肢を追加
              </button>
            )}
          </div>
        )}

        {/* 締切 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink/68">締切日（任意）</label>
          <input
            type="date"
            className="field"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={submitting} className="cta-primary w-full disabled:opacity-40">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "公開する"}
        </button>
      </form>
    </ModalShell>
  );
}
