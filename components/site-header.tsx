"use client";

import Link from "next/link";
import { LogIn, LogOut, Settings2, Shield, UserCircle } from "lucide-react";
import { LogoHorizontal } from "@/components/ui/logo";
import { NotificationDrawer } from "@/components/ui/notification-drawer";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { LoginModal } from "@/components/auth/login-modal";
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
  const { authReady, user, signOutUser } = useAuth();
  const [showManageLink, setShowManageLink] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const showAdminLink = authReady && isAdminEmail(user?.email);
  const visibleUser = user && !user.isAnonymous ? user : null;

  useEffect(() => {
    if (!visibleUser) {
      setShowManageLink(false);
      setMenuOpen(false);
      return;
    }

    void listOwnerSpotsFromFirestore(visibleUser.uid)
      .then((spots) => {
        setShowManageLink(spots.length > 0);
      })
      .catch(() => {
        setShowManageLink(false);
      });
  }, [visibleUser]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <>
    <header className="shell sticky top-0 z-[80] py-5">
      <div className="panel relative z-[80] flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center">
            <LogoHorizontal className="h-10 w-auto object-contain sm:h-9" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!visibleUser ? (
            <Link href="/owner" className="cta-secondary hidden sm:inline-flex whitespace-nowrap">
              SPOTを作る
            </Link>
          ) : null}
          <NotificationDrawer />
          {visibleUser ? (
            <div ref={menuRef} className="relative z-[90]">
              <button
                type="button"
                aria-label="プロフィール"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((current) => !current)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white text-sm font-bold text-ink transition hover:border-moss hover:text-moss"
              >
                {getInitials(visibleUser.displayName)}
              </button>
              {menuOpen ? (
                <div className="menu-surface absolute right-0 top-[calc(100%+10px)] z-[100] w-64 p-2">
                  <div className="border-b border-ink/8 px-3 py-3">
                    <div className="text-sm font-semibold text-ink">{visibleUser.displayName ?? "ログイン中"}</div>
                    <div className="mt-1 text-xs text-ink/55">{visibleUser.email}</div>
                  </div>
                  <div className="py-2">
                    <Link href="/account" className="menu-link" onClick={() => setMenuOpen(false)}>
                      <UserCircle className="h-4 w-4" />
                      応援中のSPOT
                    </Link>
                    <Link href="/manage" className="menu-link" onClick={() => setMenuOpen(false)}>
                      <Settings2 className="h-4 w-4" />
                      {showManageLink ? "運営中のSPOT" : "SPOTを作る"}
                    </Link>
                    {showAdminLink ? (
                      <Link href="/admin" className="menu-link" onClick={() => setMenuOpen(false)}>
                        <Shield className="h-4 w-4" />
                        管理
                      </Link>
                    ) : null}
                    <Link href="/settings" className="menu-link" onClick={() => setMenuOpen(false)}>
                      <Settings2 className="h-4 w-4" />
                      設定
                    </Link>
                  </div>
                  <div className="border-t border-ink/8 px-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        void signOutUser();
                      }}
                      className="menu-link w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      ログアウト
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss active:scale-[0.96]"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              はじめる
            </button>
          )}
        </div>
      </div>
    </header>
    <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}
