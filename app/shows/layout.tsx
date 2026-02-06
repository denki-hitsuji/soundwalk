// app/shows/layout.tsx
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function ShowsLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
