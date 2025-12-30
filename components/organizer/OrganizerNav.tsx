// app/musician/layout.tsx
import type { ReactNode } from 'react';
import { AppShell } from "@/components/layout/AppShell";
export default function OrganizerNav({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
