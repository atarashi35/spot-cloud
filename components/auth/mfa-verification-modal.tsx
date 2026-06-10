"use client";

import { useState } from "react";
import {
  MultiFactorError,
  TotpMultiFactorGenerator,
  getMultiFactorResolver,
} from "firebase/auth";
import { ModalShell } from "@/components/ui/modal-shell";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function MfaVerificationModal({
  open,
  error: mfaError,
  onClose,
  onVerified,
}: {
  open: boolean;
  error: MultiFactorError | null;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    if (!mfaError) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const resolver = getMultiFactorResolver(auth, mfaError);
      const hint = resolver.hints.find(
        (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID
      );
      if (!hint) throw new Error("TOTP認証が設定されていません");

      const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim());
      await resolver.resolveSignIn(assertion);
      setCode("");
      onVerified();
    } catch (e) {
      const code_ = (e as { code?: string }).code ?? "";
      if (code_ === "auth/invalid-verification-code") {
        setError("コードが正しくありません。認証アプリの現在のコードを入力してください。");
      } else {
        setError(e instanceof Error ? e.message : "認証に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="二段階認証" size="sm">
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
            onKeyDown={(e) => { if (e.key === "Enter") void verify(); }}
            placeholder="000000"
            autoFocus
          />
        </label>
        {error && <p className="text-sm font-medium text-red-700">{error}</p>}
        <button
          type="button"
          className="cta-primary w-full"
          onClick={() => void verify()}
          disabled={loading || code.length !== 6}
        >
          {loading ? "確認中..." : "ログイン"}
        </button>
      </div>
    </ModalShell>
  );
}
