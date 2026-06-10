"use client";

import { useEffect, useState } from "react";
import {
  TotpMultiFactorGenerator,
  multiFactor,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import QRCode from "qrcode";
import { ModalShell } from "@/components/ui/modal-shell";
import { getFirebaseAuth } from "@/lib/firebase/client";

type Step = "loading" | "reauth-google" | "reauth-email" | "scan" | "verify" | "done" | "error";

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
  const [password, setPassword] = useState("");
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

      const otpAuthUrl = totpSecret.generateQrCodeUrl(user.email ?? user.uid, "SPOT");
      const dataUrl = await QRCode.toDataURL(otpAuthUrl);
      setQrDataUrl(dataUrl);
      setStep("scan");
    } catch (e) {
      const errorCode = (e as { code?: string }).code ?? "";
      if (errorCode === "auth/requires-recent-login") {
        // ログインプロバイダを確認して適切な再認証画面へ
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        const isGoogle = user?.providerData.some((p) => p.providerId === "google.com");
        setStep(isGoogle ? "reauth-google" : "reauth-email");
      } else if (errorCode === "auth/operation-not-allowed") {
        setError("TOTP多要素認証が有効化されていません。管理者にお問い合わせください。");
        setStep("error");
      } else {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
        setStep("error");
      }
    }
  }

  async function reauthWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("ログインが必要です");
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      await startEnrollment();
    } catch (e) {
      setError(e instanceof Error ? e.message : "再認証に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function reauthWithEmail() {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user?.email) throw new Error("ログインが必要です");
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      setPassword("");
      await startEnrollment();
    } catch (e) {
      const errorCode = (e as { code?: string }).code ?? "";
      if (errorCode === "auth/wrong-password" || errorCode === "auth/invalid-credential") {
        setError("パスワードが正しくありません。");
      } else {
        setError(e instanceof Error ? e.message : "再認証に失敗しました");
      }
    } finally {
      setLoading(false);
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
      const errorCode = (e as { code?: string }).code ?? "";
      if (errorCode === "auth/invalid-verification-code") {
        setError("コードが正しくありません。認証アプリの現在のコードを入力してください。");
      } else {
        setError(e instanceof Error ? e.message : "登録に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      void startEnrollment();
    } else {
      setStep("loading");
      setCode("");
      setPassword("");
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <ModalShell open={open} onClose={onClose} title="二段階認証の設定" size="sm">

      {/* 準備中 */}
      {step === "loading" && (
        <div className="py-8 text-center text-ink/72">準備中...</div>
      )}

      {/* 再認証 — Google */}
      {step === "reauth-google" && (
        <div className="space-y-5 pb-2">
          <div className="rounded-[16px] bg-mist px-4 py-4">
            <p className="text-sm font-semibold text-ink">本人確認が必要です</p>
            <p className="mt-1 text-sm text-ink/72">
              セキュリティのため、二段階認証の設定にはGoogleアカウントで再度ログインしてください。
            </p>
          </div>
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          <button
            type="button"
            className="cta-primary w-full"
            onClick={() => void reauthWithGoogle()}
            disabled={loading}
          >
            {loading ? "確認中..." : "Googleアカウントで確認する"}
          </button>
        </div>
      )}

      {/* 再認証 — メール */}
      {step === "reauth-email" && (
        <div className="space-y-5 pb-2">
          <div className="rounded-[16px] bg-mist px-4 py-4">
            <p className="text-sm font-semibold text-ink">本人確認が必要です</p>
            <p className="mt-1 text-sm text-ink/72">
              セキュリティのため、パスワードを入力して本人確認を行ってください。
            </p>
          </div>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink/72">パスワード</span>
            <input
              type="password"
              className="field h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void reauthWithEmail(); }}
              placeholder="パスワードを入力"
              autoFocus
            />
          </label>
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          <button
            type="button"
            className="cta-primary w-full"
            onClick={() => void reauthWithEmail()}
            disabled={loading || !password}
          >
            {loading ? "確認中..." : "確認して続ける"}
          </button>
        </div>
      )}

      {/* QRスキャン */}
      {step === "scan" && (
        <div className="space-y-5 pb-2">
          <div className="rounded-[16px] bg-mist px-4 py-4 text-[15px] leading-6 text-ink/75">
            以下のいずれかの認証アプリでQRコードをスキャンしてください。
            <ul className="mt-2 space-y-1">
              <li>・<span className="font-semibold text-ink/75">iCloudキーチェーン</span>（iPhone / Mac に標準搭載）</li>
              <li>・Google Authenticator</li>
              <li>・Microsoft Authenticator</li>
            </ul>
          </div>
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

      {/* コード確認 */}
      {step === "verify" && (
        <div className="space-y-5 pb-2">
          <p className="text-sm text-ink/78">
            認証アプリに表示されている6桁のコードを入力してください。
          </p>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink/72">確認コード</span>
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
            className="w-full text-sm text-ink/65 hover:text-ink"
            onClick={() => setStep("scan")}
          >
            ← QRコードに戻る
          </button>
        </div>
      )}

      {/* 完了 */}
      {step === "done" && (
        <div className="space-y-5 pb-2 text-center">
          <div className="py-4">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
            <h3 className="text-lg font-bold text-ink">二段階認証を設定しました</h3>
            <p className="mt-2 text-sm text-ink/72">
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

      {/* エラー */}
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
