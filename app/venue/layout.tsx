// app/venue/layout.tsx
import type { ReactNode } from 'react';
import { AppShell } from "@/components/layout/AppShell";

export default function VenueLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
