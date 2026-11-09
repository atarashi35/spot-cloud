"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { User } from "firebase/auth";
import { QrCode } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";

export function MemberQr({ user }: { user: User }) {
  const [qr, setQr] = useState<{ token: string; expiresAt: number } | null>(null);
  const [error, setError] = useState(false);
  const [expired, setExpired] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  useEffect(() => {
    if (!qr) return;
    const timer = window.setTimeout(() => setExpired(true), Math.max(0, qr.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [qr]);
  async function create() {
    const currentRequest = ++requestId.current;
    try {
      setError(false);
      setLoading(true);
      setQr(null);
      setExpired(false);
      const token = await user.getIdToken();
      const response = await fetch("/api/account/member-qr", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error();
      const result = await response.json() as { token: string; expiresAt: number };
      if (currentRequest === requestId.current) setQr(result);
    } catch {
      if (currentRequest === requestId.current) setError(true);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }
  function close() {
    requestId.current += 1;
    setOpen(false);
    setQr(null);
    setLoading(false);
  }
  return <>
    <button type="button" className="cta-primary w-full" onClick={() => { setOpen(true); void create(); }}><QrCode className="h-5 w-5" aria-hidden="true" />会員証のQRを表示</button>
    <ModalShell open={open} onClose={close} title="会員証のQR" size="sm">
      <div className="flex min-h-64 flex-col items-center justify-center text-center" aria-live="polite">
        {loading ? <p className="text-sm text-ink/60">読み込み中...</p> : null}
        {qr && !expired ? <><div className="rounded-xl bg-white p-3"><QRCode value={`${window.location.origin}/member-checkin#${qr.token}`} size={200} style={{ maxWidth: "100%", height: "auto" }} /></div><p className="mt-3 text-sm text-ink/60">{new Date(qr.expiresAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}まで有効</p></> : null}
        {expired ? <><p className="text-sm text-ink/65">QRの有効期限が切れました。</p><button type="button" className="cta-secondary mt-4" onClick={() => void create()}>QRを更新</button></> : null}
        {error ? <><p className="text-sm text-red-700">QRを表示できませんでした。</p><button type="button" className="cta-secondary mt-4" onClick={() => void create()}>もう一度試す</button></> : null}
      </div>
    </ModalShell>
  </>;
}
