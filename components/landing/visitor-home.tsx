"use client";

import Link from "next/link";
import { useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";

export function VisitorHome() {
  const [loginOpen, setLoginOpen] = useState(false);
  return <main className="shell mx-auto max-w-5xl pb-20 pt-12 sm:pt-20">
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold leading-tight text-ink sm:text-5xl">好きな活動と、<br />つながっていく。</h1>
      <p className="mt-5 text-base leading-8 text-ink/70">SPOTは、クリエイターや団体とサポーターをつなぐ場所です。</p>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/spots" className="cta-primary">SPOTを探す</Link><button type="button" onClick={() => setLoginOpen(true)} className="cta-secondary">会員登録・ログイン</button></div>
    </div>
    <div className="mt-16 border-t border-ink/10 pt-7">
      <h2 className="text-lg font-bold">クリエイター・団体の方へ</h2>
      <p className="mt-2 text-sm leading-7 text-ink/65">活動を紹介し、サポーターとつながれます。</p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-moss"><Link href="/owner">登録する →</Link><Link href="/for-owners">仕組みと料金を見る →</Link></div>
    </div>
    <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
  </main>;
}
