"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** モーダル幅。デフォルトは "md"（max-w-xl） */
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
  sm: "max-w-lg",
  md: "max-w-xl",
  lg: "max-w-2xl"
};

export function ModalShell({ open, onClose, title, children, size = "md" }: ModalShellProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => element.getClientRects().length > 0);
    (focusable()[0] ?? dialog)?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (!items.length) { e.preventDefault(); dialog?.focus(); return; }
      if (e.shiftKey && (document.activeElement === items[0] || !dialog?.contains(document.activeElement))) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && (document.activeElement === items[items.length - 1] || !dialog?.contains(document.activeElement))) { e.preventDefault(); items[0].focus(); }
    };
    document.addEventListener("keydown", handler);
    return () => { document.removeEventListener("keydown", handler); previousFocus?.focus(); };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-ink/35 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={`menu-surface relative z-[141] flex max-h-[calc(100dvh-3rem)] w-full flex-col ${SIZE_CLASS[size]} overflow-hidden`}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/8 px-5 py-4 sm:px-6 sm:py-5">
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="閉じる">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}
