"use client";

import { ChevronLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import {
  PlanAmount,
  SocioAgeRange,
  SocioGender,
  Spot,
  planOptions
} from "@/lib/types";

const ageRangeOptions: SocioAgeRange[] = [
  "10代以下",
  "20代",
  "30代",
  "40代",
  "50代",
  "60代以上"
];

const genderOptions: SocioGender[] = ["女性", "男性", "その他", "回答しない"];

// Firebase Auth エラーコードを日本語に変換
function formatAuthError(error: unknown): string {
  const code = (error as { code?: string }).code ?? "";

  switch (code) {
    case "auth/email-already-in-use":
      return "このメールアドレスはすでに登録されています。パスワードでログインしてください。";
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません。";
    case "auth/weak-password":
      return "パスワードは6文字以上にしてください。";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "auth/too-many-requests":
      return "ログイン試行が多すぎます。しばらくしてからお試しください。";
    case "auth/network-request-failed":
      return "ネットワークエラーが発生しました。接続を確認してください。";
    default:
      return "認証エラーが発生しました。もう一度お試しください。";
  }
}

type Step = "login" | "password" | "profile";

export function SocioSignupModal({
  spot,
  open,
  onClose,
  defaultPlan = 100
}: {
  spot: Spot;
  open: boolean;
  onClose: () => void;
  defaultPlan?: PlanAmount;
}) {
  const { user, signInWithGoogle } = useAuth();

  const [step, setStep] = useState<Step>("login");
  const [planAmount, setPlanAmount] = useState<PlanAmount>(defaultPlan);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが開いたときの初期化
  useEffect(() => {
    if (!open) return;

    setPlanAmount(defaultPlan);
    setPassword("");
    setIsNewUser(false);
    setError(null);

    if (user) {
      // すでにログイン済み → プロフィール入力へ
      setName(user.displayName ?? "");
      setEmail(user.email ?? "");
      setStep("profile");
    } else {
      setEmail("");
      setName("");
      setStep("login");
    }
  }, [open, defaultPlan, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Googleログイン成功後に user が変わったらプロフィール画面へ
  useEffect(() => {
    if (!open || !user) return;

    if (step === "login" || step === "password") {
      setName(user.displayName ?? "");
      setEmail(user.email ?? "");
      setStep("profile");
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESCキーで閉じる
  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  // ─── Googleで続ける ───────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // user が更新されたら useEffect が profile ステップへ移動させる
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google ログインに失敗しました。");
    } finally {
      setGoogleLoading(false);
    }
  }

  // ─── メールで続ける ───────────────────────────────────────────────
  function handleEmailContinue() {
    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("メールアドレスの形式が正しくありません。");
      return;
    }

    setError(null);
    setPassword("");
    setIsNewUser(false);
    setStep("password");
  }

  // ─── パスワードでログイン or 新規登録 ────────────────────────────
  async function handlePasswordSubmit() {
    if (!password.trim()) {
      setError("パスワードを入力してください。");
      return;
    }

    if (isNewUser && !name.trim()) {
      setError("お名前を入力してください。");
      return;
    }

    setLoading(true);
    setError(null);

    const auth = getFirebaseAuth();

    if (isNewUser) {
      // 新規登録モード
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        // user が更新されたら useEffect が profile ステップへ移動させる
      } catch (cause) {
        setError(formatAuthError(cause));
      } finally {
        setLoading(false);
      }
    } else {
      // ログインを試みる
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // user が更新されたら useEffect が profile ステップへ移動させる
      } catch (cause) {
        const code = (cause as { code?: string }).code ?? "";

        if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
          // 未登録 → 新規登録モードに切り替え
          setIsNewUser(true);
          setPassword("");
          setError("このメールアドレスは未登録です。お名前とパスワードを設定して新規登録してください。");
        } else {
          setError(formatAuthError(cause));
        }

        setLoading(false);
      }
    }
  }

  // ─── Stripe Checkout へ進む ────────────────────────────────────
  async function startCheckout() {
    if (!user) {
      setError("ログインが必要です。");
      return;
    }

    if (!name.trim()) {
      setError("お名前を入力してください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          spotId: spot.id,
          planAmount,
          name: name.trim(),
          ageRange: ageRange || undefined,
          gender: gender || undefined
        })
      });

      const data = (await response.json()) as { url?: string; message?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.message ?? data.error ?? "Checkout セッションの作成に失敗しました。");
      }

      window.location.href = data.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加入処理に失敗しました。");
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-ink/35 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <section className="menu-surface relative z-[141] w-full max-w-4xl overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative p-6 sm:p-8">
            {/* 閉じるボタン */}
            <button type="button" className="icon-button absolute right-6 top-6" onClick={onClose} aria-label="閉じる">
              <X className="h-4 w-4" />
            </button>

            <span className="chip">SOCIO</span>

            {/* ─── Step: login ─────────────────────────────── */}
            {step === "login" ? (
              <>
                <h2 className="mt-5 text-3xl font-bold text-ink">ソシオ登録</h2>
                <p className="mt-2 text-sm text-ink/58">
                  加入にはアカウントが必要です。ログインまたは新規登録してください。
                </p>

                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    className="cta-secondary w-full"
                    onClick={() => void handleGoogle()}
                    disabled={googleLoading}
                  >
                    {googleLoading ? "接続中..." : "Googleで続ける"}
                  </button>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-ink/10" />
                  <span className="text-xs text-ink/40">または</span>
                  <div className="h-px flex-1 bg-ink/10" />
                </div>

                <div className="mt-5 space-y-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">メールアドレス</span>
                    <input
                      type="email"
                      className="field h-14"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEmailContinue(); }}
                      placeholder="you@email.com"
                    />
                  </label>
                  <button type="button" className="cta-primary w-full" onClick={handleEmailContinue}>
                    メールで続ける
                  </button>
                </div>
              </>
            ) : null}

            {/* ─── Step: password ──────────────────────────── */}
            {step === "password" ? (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <button type="button" className="icon-button" onClick={() => { setStep("login"); setError(null); }} aria-label="戻る">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-ink">
                      {isNewUser ? "新規登録" : "ログイン"}
                    </h2>
                    <p className="mt-1 text-sm text-ink/55">{email}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {/* 新規登録モードのときだけ名前フィールドを表示 */}
                  {isNewUser ? (
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-ink/62">お名前</span>
                      <input
                        className="field h-14"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="山田 太郎"
                      />
                    </label>
                  ) : null}

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">パスワード</span>
                    <input
                      type="password"
                      className="field h-14"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void handlePasswordSubmit(); }}
                      placeholder={isNewUser ? "6文字以上" : "パスワード"}
                    />
                  </label>

                  <button
                    type="button"
                    className="cta-primary w-full"
                    onClick={() => void handlePasswordSubmit()}
                    disabled={loading}
                  >
                    {loading
                      ? "処理中..."
                      : isNewUser
                        ? "登録してソシオになる"
                        : "ログインして続ける"}
                  </button>
                </div>
              </>
            ) : null}

            {/* ─── Step: profile ───────────────────────────── */}
            {step === "profile" && user ? (
              <>
                <h2 className="mt-5 text-3xl font-bold text-ink">加入情報</h2>
                <p className="mt-2 text-sm text-ink/55">{user.email}</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-ink/62">お名前</span>
                    <input
                      className="field h-14"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="お名前"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">年齢（任意）</span>
                    <select
                      className="field h-14"
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                    >
                      <option value="">選択しない</option>
                      {ageRangeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">性別（任意）</span>
                    <select
                      className="field h-14"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">選択しない</option>
                      {genderOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {planOptions.map((amount) => {
                    const active = amount === planAmount;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPlanAmount(amount)}
                        className={`rounded-[24px] border p-5 text-left transition ${
                          active ? "border-ink bg-ink text-white" : "border-ink/10 bg-mist text-ink"
                        }`}
                      >
                        <div className="text-[11px] font-semibold tracking-[0.18em] opacity-65">MONTHLY</div>
                        <div className="mt-2 text-4xl font-bold">¥{amount}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="cta-primary w-full"
                    onClick={() => void startCheckout()}
                    disabled={loading}
                  >
                    {loading ? "移動中..." : "支払いへ進む"}
                  </button>
                </div>
              </>
            ) : null}

            {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
          </div>

          {/* ─── 右パネル: SPOT情報 ───────────────────────── */}
          <aside className="border-t border-ink/8 bg-mist/75 p-6 md:border-l md:border-t-0 md:p-8">
            <div className="rounded-[28px] border border-ink/8 bg-white/80 p-5 shadow-sm">
              <span className="chip">SPOT</span>
              <h3 className="mt-4 text-2xl font-bold text-ink">{spot.name}</h3>
              <p className="mt-3 text-sm leading-7 text-ink/62">{spot.shortDescription || spot.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-ink/8 pt-4 text-sm text-ink/62">
                <span>月額</span>
                <span className="text-lg font-semibold text-ink">¥{planAmount}</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-ink/45">
              「支払いへ進む」をクリックすることで、
              <a href="/terms" className="underline hover:text-moss" target="_blank" rel="noreferrer">利用規約</a>
              および
              <a href="/privacy" className="underline hover:text-moss" target="_blank" rel="noreferrer">プライバシーポリシー</a>
              に同意したものとみなします。
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
