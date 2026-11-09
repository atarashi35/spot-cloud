"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { VisitorHome } from "@/components/landing/visitor-home";
import { MemberHome } from "@/components/account/member-home";

export function HomeClient() {
  const { authReady, user } = useAuth();
  if (!authReady) return <div className="shell mx-auto max-w-2xl py-10" role="status"><span className="sr-only">読み込み中</span><div className="h-7 w-24 animate-pulse rounded bg-ink/10" /><div className="mt-8 h-40 animate-pulse rounded-2xl bg-white/70" /></div>;
  return user && !user.isAnonymous ? <MemberHome user={user} /> : <VisitorHome />;
}
