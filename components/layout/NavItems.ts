// ===== nav 定義 =====
export type NavItem = {
  label: string;
  href: string;
  requiresAuth?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "トップ", href: "/musician", requiresAuth: true },
  { label: "演奏できる曲", href: "/musician/songs", requiresAuth: true },
  { label: "ライブ", href: "/musician/performances", requiresAuth: true },
  { label: "カレンダー", href: "/musician/calendar", requiresAuth: true },
  { label: "出演名義（アクト）", href: "/musician/acts", requiresAuth: true },
  { label: "企画管理", href: "/organizer", requiresAuth: true },
  { label: "会場管理", href: "/venue", requiresAuth: true },
  { label: "マップ", href: "/map", requiresAuth: false },
  { label: "プロフィール", href: "/musician/profile", requiresAuth: true },
];