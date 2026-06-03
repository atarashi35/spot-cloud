"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications
} from "@/lib/firestore/notifications";
import { AppNotification } from "@/lib/types";

function notifHref(n: AppNotification): string {
  if (n.type === "new_post" && n.resourceId) return `/spots/${n.spotId}/posts/${n.resourceId}`;
  if (n.type === "new_event" && n.resourceId) return `/spots/${n.spotId}/events/${n.resourceId}`;
  return `/spots/${n.spotId}/member`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export function NotificationDrawer() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    const unsub = subscribeToNotifications(user.uid, setNotifications);
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (!drawerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);

  async function handleOpen() {
    setOpen((v) => !v);
  }

  async function handleMarkAllRead() {
    if (!user || unreadIds.length === 0) return;
    await markAllNotificationsRead(user.uid, unreadIds);
  }

  async function handleClickNotif(n: AppNotification) {
    if (!user || n.isRead) return;
    await markNotificationRead(user.uid, n.id);
  }

  if (!user) return null;

  return (
    <div ref={drawerRef} className="relative z-[90]">
      <button
        type="button"
        className="icon-button relative"
        aria-label="通知"
        onClick={() => void handleOpen()}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="menu-surface absolute right-0 top-[calc(100%+10px)] z-[100] w-80 overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
            <span className="text-sm font-bold text-ink">通知</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-ink/50 hover:text-ink transition-colors"
                onClick={() => void handleMarkAllRead()}
              >
                すべて既読
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink/40">通知はありません</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={notifHref(n) as `/spots/${string}`}
                  onClick={() => { void handleClickNotif(n); setOpen(false); }}
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-mist ${!n.isRead ? "bg-moss/5" : ""}`}
                >
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-moss" />
                  )}
                  <div className={!n.isRead ? "" : "ml-5"}>
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-ink/55 line-clamp-2">{n.body}</p>}
                    <p className="mt-1 text-xs text-ink/35">{n.spotName} · {timeAgo(n.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
