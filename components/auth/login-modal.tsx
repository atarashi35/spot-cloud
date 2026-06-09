"use client";

import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { useAuth } from "@/components/providers/auth-provider";
import { ModalShell } from "@/components/ui/modal-shell";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { EMAIL_LINK_STORAGE_KEY, EmailSignInState } from "@/lib/auth/email-link";

type Step = "login" | "email_sent";

export function LoginModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { signInWithGoogle } = useAuth();
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("login");
      setEmail("");
      setError(null);
    }
  }, [open]);

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      else onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google ログインに失敗しました。");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSendEmailLink() {
    const trimmed = email.trim();
    if (!trimmed) { setError("メールアドレスを入力してください。"); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setError("メールアドレスの形式が正しくありません。"); return; }

    setLoading(true);
    setError(null);

    const auth = getFirebaseAuth();
    const callbackUrl = `${window.location.origin}/auth/email-callback`;

    const state: EmailSignInState = { email: trimmed, spotId: "", planAmount: 0 };
    localStorage.setItem(EMAIL_LINK_STORAGE_KEY, JSON.stringify(state));

    try {
      await sendSignInLinkToEmail(auth, trimmed, {
        url: callbackUrl,
        handleCodeInApp: true
      });
      setStep("email_sent");
    } catch (cause) {
      localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
      const code = (cause as { code?: string }).code ?? "";
      let msg = "メールの送信に失敗しました。もう一度お試しください。";
      if (code === "auth/invalid-email") msg = "メールアドレスの形式が正しくありません。";
      if (code === "auth/too-many-requests") msg = "送信回数が多すぎます。しばらくしてからお試しください。";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="ログイン" size="sm">
      {step === "login" ? (
        <div className="space-y-5 pb-2">
          <div>
            <h2 className="text-2xl font-bold text-ink">ログイン / 新規登録</h2>
            <p className="mt-2 text-sm text-ink/58">アカウントをお持ちでない方も、そのまま新規登録できます。</p>
          </div>

          <button
            type="button"
            className="cta-secondary w-full"
            onClick={() => void handleGoogle()}
            disabled={googleLoading}
          >
            {googleLoading ? "接続中..." : "Googleで続ける"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="text-xs text-ink/40">または</span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <div className="space-y-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink/62">メールアドレス</span>
              <input
                type="email"
                className="field h-14"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSendEmailLink(); }}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </label>
            <button
              type="button"
              className="cta-primary w-full"
              onClick={() => void handleSendEmailLink()}
              disabled={loading}
            >
              {loading ? "送信中..." : "メールで続ける"}
            </button>
          </div>

          {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
        </div>
      ) : (
        <div className="space-y-5 pb-2">
          <h2 className="text-2xl font-bold text-ink">メールを確認してください</h2>
          <div className="flex flex-col items-center gap-4 rounded-[20px] bg-mist p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <Mail className="h-6 w-6 text-ink/70" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{email}</p>
              <p className="mt-2 text-sm leading-7 text-ink/65">
                上記のアドレスにメールリンクを送信しました。<br />
                メール内のリンクをクリックするとログインが完了します。
              </p>
            </div>
          </div>
          <p className="text-xs leading-6 text-ink/45">
            メールが届かない場合は迷惑メールフォルダをご確認ください。
            <button
              type="button"
              className="ml-1 underline hover:text-ink"
              onClick={() => { setStep("login"); setError(null); }}
            >
              再送信
            </button>
          </p>
        </div>
      )}
    </ModalShell>
  );
}
