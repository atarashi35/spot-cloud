"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { TopLanding } from "@/components/landing/top-landing";
import { MemberHome } from "@/components/account/member-home";

export function HomeClient() {
  const { authReady, user } = useAuth();
  if (!authReady) return <TopLanding />;
  return user && !user.isAnonymous ? <MemberHome user={user} /> : <TopLanding />;
}
