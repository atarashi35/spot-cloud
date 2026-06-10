"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  EMAIL_JOIN_PENDING_KEY,
  EMAIL_LINK_STORAGE_KEY,
  EmailJoinPending,
  EmailSignInState
} from "@/lib/auth/email-link";

type Status = "verifying" | "success" | "need_email" | "error";

export function EmailCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("verifying");
  const [manualEmail, setManualEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // URL から SPOT 情報を取得（マルチデバイス対応）
  const spotIdFromUrl = searchParams.get("spotId") ?? "";
  const planFromUrl = Number(searchParams.get("plan") ?? "100");

  useEffect(() => {
    void handleEmailLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEmailLink(overrideEmail?: string) {
    const auth = getFirebaseAuth();

    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setStatus("error");
      setErrorMsg("このリンクは無効または期限切れです。");
      return;
    }

    // localStorage から保存済み状態を読み込む
    let savedState: EmailSignInState | null = null;
    try {
      const raw = localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
      if (raw) savedState = JSON.parse(raw) as EmailSignInState;
    } catch {
      // parse error → savedState は null のまま
    }

    const email = overrideEmail ?? savedState?.email ?? null;

    // メールアドレスが取得できない場合（別デバイスで開いたケース）
    if (!email) {
      setStatus("need_email");
      return;
    }

    // spotId / planAmount はメールリンク URL のパラメータを優先する。
    // localStorage は複数タブ・複数 SPOT でのリンク送信で上書きされる可能性があるため、
    // リンクに埋め込まれた URL パラメータ（Firebase が oobCode とともに保持する）が真の値。
    const spotId = spotIdFromUrl || savedState?.spotId || "";
    const planAmount = planFromUrl || savedState?.planAmount || 100;

    try {
      const credential = await signInWithEmailLink(auth, email, window.location.href);

      const idToken = await credential.user.getIdToken();

      await fetch("/api/auth/claim-memberships", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });

      // 使い終わったサインイン状態ストレージを削除
      localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);

      // モーダル自動オープン用に加入情報を sessionStorage へ保存
      // （URL パラメータ経由は Next.js ルーティングと競合するため使わない）
      if (spotId) {
        const pending: EmailJoinPending = { spotId, planAmount };
        sessionStorage.setItem(EMAIL_JOIN_PENDING_KEY, JSON.stringify(pending));
      }

      setStatus("success");

      // SPOT 詳細ページへ戻る（クエリパラメータなし）
      const destination = spotId ? `/spots/${spotId}` : "/";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(destination as any);
    } catch (cause) {
      const code = (cause as { code?: string }).code ?? "";
      let msg = "認証に失敗しました。もう一度リンクをクリックしてください。";
      if (code === "auth/invalid-action-code") {
        msg = "認証リンクの有効期限が切れているか、すでに使用済みです。";
      } else if (code === "auth/invalid-email") {
        msg = "メールアドレスが一致しません。";
      }
      setStatus("error");
      setErrorMsg(msg);
    }
  }

  // ─── 別デバイスでリンクを開いたケース ───────────────────────────────
  if (status === "need_email") {
    return (
      <div className="panel mx-auto max-w-md px-8 py-10">
        <span className="chip">SUPPORTER</span>
        <h1 className="mt-5 text-2xl font-extrabold text-ink">メールアドレスを確認</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
          別のデバイスでリンクを開いたため、認証に使ったメールアドレスの入力が必要です。
        </p>
        <div className="mt-6 space-y-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink/72">メールアドレス</span>
            <input
              type="email"
              className="field h-14"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleEmailLink(manualEmail.trim());
              }}
              placeholder="you@email.com"
              autoFocus
            />
          </label>
          <button
            type="button"
            className="cta-primary w-full"
            onClick={() => void handleEmailLink(manualEmail.trim())}
          >
            確認して続ける
          </button>
        </div>
        {errorMsg ? <p className="mt-4 text-sm font-medium text-red-700">{errorMsg}</p> : null}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="panel mx-auto max-w-md px-8 py-10">
        <span className="chip">エラー</span>
        <h1 className="mt-5 text-2xl font-extrabold text-ink">認証エラー</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{errorMsg}</p>
        <button
          type="button"
          className="cta-secondary mt-6"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={() => router.replace("/" as any)}
        >
          トップへ戻る
        </button>
      </div>
    );
  }

  return (
    <div className="panel mx-auto max-w-md px-8 py-10 text-center">
      <p className="text-sm text-ink/72">
        {status === "success" ? "ログイン完了。移動しています…" : "認証を確認しています…"}
      </p>
    </div>
  );
}
