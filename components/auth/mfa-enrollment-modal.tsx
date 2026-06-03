"use client";

import { useState } from "react";
import {
  TotpMultiFactorGenerator,
  multiFactor,
  getMultiFactorResolver,
} from "firebase/auth";
import QRCode from "qrcode";
import { ModalShell } from "@/components/ui/modal-shell";
import { getFirebaseAuth } from "@/lib/firebase/client";

type Step = "loading" | "scan" | "verify" | "done" | "error";

export function MfaEnrollmentModal({
  open,
  onClose,
  onEnrolled,
}: {
  open: boolean;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const [step, setStep] = useState<Step>("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState<Awaited<ReturnType<typeof TotpMultiFactorGenerator.generateSecret>> | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startEnrollment() {
    setStep("loading");
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("ログインが必要です");

      const session = await multiFactor(user).getSession();
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(session);
      setSecret(totpSecret);

      const otpAuthUrl = totpSecret.generateQrCodeUrl(user.email ?? user.uid, "SPOT Cloud");
      const dataUrl = await QRCode.toDataURL(otpAuthUrl);
      setQrDataUrl(dataUrl);
      setStep("scan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setStep("error");
    }
  }

  async function verifyAndEnroll() {
    if (!secret) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("ログインが必要です");

      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim());
      await multiFactor(user).enroll(assertion, "認証アプリ");
      setStep("done");
    } catch (e) {
      const code_ = (e as { code?: string }).code ?? "";
      if (code_ === "auth/invalid-verification-code") {
        setError("コードが正しくありません。認証アプリの現在のコードを入力してください。");
      } else {
        setError(e instanceof Error ? e.message : "登録に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOpen(isOpen: boolean) {
    if (isOpen && step === "loading") {
      void startEnrollment();
    }
    if (!isOpen) {
      setStep("loading");
      setCode("");
      setError(null);
    }
  }

  // open変化を監視して開始
  if (open && step === "loading" && !error) {
    void startEnrollment();
  }

  return (
    <ModalShell open={open} onClose={onClose} title="二段階認証の設定" size="sm">
      {step === "loading" && (
        <div className="py-8 text-center text-ink/60">準備中...</div>
      )}

      {step === "scan" && (
        <div className="space-y-5 pb-2">
          <p className="text-sm text-ink/70">
            Google Authenticator などの認証アプリで下のQRコードをスキャンしてください。
          </p>
          {qrDataUrl && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="TOTP QR Code" className="h-48 w-48 rounded-lg" />
            </div>
          )}
          <button
            type="button"
            className="cta-primary w-full"
            onClick={() => setStep("verify")}
          >
            スキャンしました →
          </button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-5 pb-2">
          <p className="text-sm text-ink/70">
            認証アプリに表示されている6桁のコードを入力してください。
          </p>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink/62">確認コード</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="field h-14 text-center text-2xl tracking-widest"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") void verifyAndEnroll(); }}
              placeholder="000000"
              autoFocus
            />
          </label>
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          <button
            type="button"
            className="cta-primary w-full"
            onClick={() => void verifyAndEnroll()}
            disabled={loading || code.length !== 6}
          >
            {loading ? "確認中..." : "設定を完了する"}
          </button>
          <button
            type="button"
            className="w-full text-sm text-ink/50 hover:text-ink"
            onClick={() => setStep("scan")}
          >
            ← QRコードに戻る
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-5 pb-2 text-center">
          <div className="py-4">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
            <h3 className="text-lg font-bold text-ink">二段階認証を設定しました</h3>
            <p className="mt-2 text-sm text-ink/60">
              次回ログインから認証アプリのコードが必要になります。
            </p>
          </div>
          <button
            type="button"
            className="cta-primary w-full"
            onClick={() => { onEnrolled(); onClose(); }}
          >
            完了
          </button>
        </div>
      )}

      {step === "error" && (
        <div className="space-y-4 pb-2">
          <p className="text-sm text-red-700">{error}</p>
          <button type="button" className="cta-secondary w-full" onClick={() => void startEnrollment()}>
            再試行
          </button>
        </div>
      )}
    </ModalShell>
  );
}
