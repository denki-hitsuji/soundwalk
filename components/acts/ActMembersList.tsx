export function ActMembersList(props: {
  members: Array<{
    profile_id: string;
    display_name: string | null;
    role: string;
    is_owner: boolean;
    is_admin: boolean;
  }>;
}) {
  const { members } = props;

  if (!members || members.length === 0) {
    return <div className="text-xs text-gray-500">メンバーがまだいません</div>;
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
      <div className="text-sm font-semibold">メンバー</div>

      <ul className="divide-y">
        {members.map((m) => {
          const name = (m.display_name ?? "").trim() || "（名前未設定）";
          return (
            <li key={m.profile_id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{name}</div>
                <div className="text-[11px] text-gray-500">
                  {m.is_owner ? "owner" : m.role || "member"}
                  {m.is_admin && !m.is_owner ? " / admin" : ""}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {m.is_owner && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    OWNER
                  </span>
                )}
                {!m.is_owner && m.is_admin && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    ADMIN
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
