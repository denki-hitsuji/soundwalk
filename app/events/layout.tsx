// app/events/layout.tsx
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
