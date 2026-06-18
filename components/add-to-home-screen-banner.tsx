"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare } from "lucide-react";

const DISMISSED_KEY = "spot_a2hs_dismissed";

type InstallMode = "ios" | "android" | null;

export function AddToHomeScreenBanner() {
  const [mode, setMode] = useState<InstallMode>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // すでにスタンドアロン（インストール済み）なら表示しない
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // 一度閉じた人には表示しない
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
    const isAndroidChrome = /Android/.test(ua) && /Chrome/.test(ua);

    if (isIos) {
      setMode("ios");
      setVisible(true);
      return;
    }

    if (isAndroidChrome) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as Event & { prompt: () => Promise<void> });
        setMode("android");
        setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
    setShowIosGuide(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    dismiss();
  }

  if (!visible) return null;

  return (
    <>
      {/* バナー本体 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-ink/8 bg-white px-4 py-3 shadow-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand">
            <PlusSquare className="h-5 w-5 text-ink/60" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight text-ink">
              ホーム画面に追加しよう
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink/50">
              アイコンからすぐ開けます
            </p>
          </div>
          {mode === "ios" ? (
            <button
              type="button"
              onClick={() => setShowIosGuide(true)}
              className="shrink-0 rounded-full bg-teal px-3.5 py-1.5 text-[12px] font-semibold text-white transition active:scale-95"
            >
              追加する
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInstall}
              className="shrink-0 rounded-full bg-teal px-3.5 py-1.5 text-[12px] font-semibold text-white transition active:scale-95"
            >
              追加する
            </button>
          )}
          <button
            type="button"
            aria-label="閉じる"
            onClick={dismiss}
            className="shrink-0 rounded-full p-1 text-ink/30 transition hover:text-ink/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* iOS向け手順ガイド */}
      {showIosGuide ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-ink">ホーム画面に追加する方法</p>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setShowIosGuide(false)}
                className="rounded-full p-1 text-ink/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-ink/70">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold text-ink">1</span>
                <span>
                  画面下の
                  <Share className="mx-1 inline h-4 w-4 text-teal" />
                  <strong className="text-ink">共有ボタン</strong>をタップ
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold text-ink">2</span>
                <span>
                  メニューを下にスクロールして<strong className="text-ink">「ホーム画面に追加」</strong>をタップ
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold text-ink">3</span>
                <span>
                  右上の<strong className="text-ink">「追加」</strong>をタップして完了
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={dismiss}
              className="mt-5 w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-white transition active:scale-95"
            >
              わかった
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
