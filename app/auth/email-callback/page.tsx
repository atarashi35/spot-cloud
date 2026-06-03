import { Suspense } from "react";
import { EmailCallbackClient } from "@/components/auth/email-callback-client";

export const metadata = {
  title: "メール認証 | SPOT"
};

export default function EmailCallbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Suspense fallback={<div className="panel px-8 py-10 text-center text-sm text-ink/60">読み込み中…</div>}>
        <EmailCallbackClient />
      </Suspense>
    </div>
  );
}
