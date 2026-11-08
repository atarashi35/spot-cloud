"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { User } from "firebase/auth";

export function MemberQr({ user }: { user: User }) {
  const [qr, setQr] = useState<{ token: string; expiresAt: number } | null>(null);
  const [error, setError] = useState(false);
  async function create() {
    try {
      setError(false);
      const token = await user.getIdToken();
      const response = await fetch("/api/account/member-qr", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error();
      setQr(await response.json() as { token: string; expiresAt: number });
    } catch { setError(true); }
  }
  return <div className="text-center">
    <button type="button" className="cta-secondary text-sm" onClick={() => void create()}>{qr ? "QRを更新" : "受付用QRを表示"}</button>
    {qr ? <div className="mt-3 inline-block rounded-xl bg-white p-4"><QRCode value={`${window.location.origin}/member-checkin#${qr.token}`} size={180} /><p className="mt-2 text-xs text-ink/65">{new Date(qr.expiresAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}まで有効</p></div> : null}
    {error ? <p className="mt-2 text-sm text-red-700">QRを表示できませんでした。</p> : null}
  </div>;
}
