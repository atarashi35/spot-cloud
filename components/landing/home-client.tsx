"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { VisitorHome } from "@/components/landing/visitor-home";
import { MemberHome } from "@/components/account/member-home";

export function HomeClient() {
  const { authReady, user } = useAuth();
  if (!authReady) return <VisitorHome />;
  return user && !user.isAnonymous ? <MemberHome user={user} /> : <VisitorHome />;
}
