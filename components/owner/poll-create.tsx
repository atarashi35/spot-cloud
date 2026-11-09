"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { ModalShell } from "@/components/ui/modal-shell";

export function PollCreate({ spotId, onClose }: { spotId: string; onClose: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [scope, setScope] = useState("supporters");
  const [deadline, setDeadline] = useState("");
  const [multiple, setMultiple] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || saving) return;
    setSaving(true); setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${encodeURIComponent(spotId)}/polls`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ title, body, options, scope, multiple, deadline: deadline ? new Date(deadline).toISOString() : null }) });
      if (!response.ok) throw new Error();
      onClose();
    } catch { setError("作成できませんでした。入力内容を確認してください。"); } finally { setSaving(false); }
  }
  return <ModalShell open onClose={onClose} title="投票を作成" size="sm"><form onSubmit={submit} className="space-y-4">
    <label className="block text-sm font-semibold">質問<input className="field mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} /></label>
    <label className="block text-sm font-semibold">説明（任意）<textarea className="field mt-1" rows={2} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} /></label>
    <div className="space-y-2"><span className="text-sm font-semibold">選択肢</span>{options.map((value, i) => <div key={i} className="flex gap-2"><input className="field" aria-label={`選択肢 ${i + 1}`} placeholder={`選択肢 ${i + 1}`} value={value} onChange={(e) => setOptions((old) => old.map((v, n) => n === i ? e.target.value : v))} required maxLength={200} />{options.length > 2 ? <button type="button" aria-label={`選択肢 ${i + 1}を削除`} onClick={() => setOptions((old) => old.filter((_, n) => n !== i))} className="icon-button shrink-0"><Trash2 className="h-4 w-4" /></button> : null}</div>)}{options.length < 20 ? <button type="button" onClick={() => setOptions((old) => [...old, ""])} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-moss"><Plus className="h-4 w-4" />選択肢を追加</button> : null}</div>
    <label className="block text-sm font-semibold">公開範囲<select className="field mt-1" value={scope} onChange={(e) => setScope(e.target.value)}><option value="public">全員</option><option value="supporters">サポーター</option><option value="paid">月額サポーター</option></select></label>
    <label className="block text-sm font-semibold">締切（任意）<input type="datetime-local" className="field mt-1" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} />複数の選択肢を選べる</label>
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}<button className="cta-primary w-full" disabled={saving}>{saving ? "公開中..." : "公開"}</button>
  </form></ModalShell>;
}
