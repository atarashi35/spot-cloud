"use client";

import Link from "next/link";
import { Bell, LayoutGrid, LogIn, LogOut, Search, Settings2, Shield, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { listOwnerSpotsFromFirestore } from "@/lib/firestore/spots";
import { isAdminEmail } from "@/lib/auth/admin";

function getInitials(name: string | null | undefined) {
  if (!name) {
    return "S";
  }

  const trimmed = name.trim();

  if (!trimmed) {
    return "S";
  }

  return trimmed.slice(0, 1).toUpperCase();
}

export function SiteHeader() {
  const { authReady, user, signInWithGoogle, signOutUser } = useAuth();
  const [showManageLink, setShowManageLink] = useState(false);
  const showAdminLink = authReady && isAdminEmail(user?.email);
  const showOperatorMenu = showAdminLink || showManageLink;

  useEffect(() => {
    if (!user) {
      setShowManageLink(false);
      return;
    }

    void listOwnerSpotsFromFirestore(user.uid)
      .then((spots) => {
        setShowManageLink(spots.length > 0);
      })
      .catch(() => {
        setShowManageLink(false);
      });
  }, [user]);

  return (
    <header className="shell sticky top-0 z-[80] py-5">
      <div className="panel relative z-[80] flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <div className="font-serif text-2xl font-bold tracking-tight text-ink">SPOT</div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/" className="icon-button" aria-label="SPOT MAP">
            <Search className="h-4 w-4" />
          </Link>
          <button type="button" className="icon-button text-ink/45" aria-label="通知">
            <Bell className="h-4 w-4" />
          </button>
          {user ? (
            <details className="group relative z-[90]">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-ink/10 bg-white text-sm font-bold text-ink transition hover:border-moss hover:text-moss">
                {getInitials(user.displayName)}
              </summary>
              <div className="menu-surface absolute right-0 top-[calc(100%+10px)] z-[100] w-64 p-2">
                <div className="border-b border-ink/8 px-3 py-3">
                  <div className="text-sm font-semibold text-ink">{user.displayName ?? "ログイン中"}</div>
                  <div className="mt-1 text-xs text-ink/55">{user.email}</div>
                </div>
                <div className="py-2">
                  <Link href="/account" className="menu-link">
                    <LayoutGrid className="h-4 w-4" />
                    所属中のSPOT
                  </Link>
                  {showOperatorMenu ? (
                    <Link href="/manage" className="menu-link">
                      <Settings2 className="h-4 w-4" />
                      運営するSPOT
                    </Link>
                  ) : null}
                  {showAdminLink ? (
                    <Link href="/admin" className="menu-link">
                      <Shield className="h-4 w-4" />
                      管理
                    </Link>
                  ) : null}
                  <Link href="/settings" className="menu-link">
                    <Settings2 className="h-4 w-4" />
                    設定
                  </Link>
                </div>
                <div className="border-t border-ink/8 px-2 pt-2">
                  <button type="button" onClick={signOutUser} className="menu-link w-full">
                    <LogOut className="h-4 w-4" />
                    ログアウト
                  </button>
                </div>
              </div>
            </details>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss"
            >
              <LogIn className="h-4 w-4" />
              ログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
