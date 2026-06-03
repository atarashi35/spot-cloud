"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-ink/35 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <section className={`menu-surface relative z-[141] w-full ${SIZE_CLASS[size]} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-ink/8 px-6 py-5">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="閉じる">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}
