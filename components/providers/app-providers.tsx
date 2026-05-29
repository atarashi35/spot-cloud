"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
