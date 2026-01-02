#!/usr/bin/env zsh
set -euo pipefail

# ============================================
# lib/ 再編スクリプト
# - git repo なら git mv を使う（履歴維持）
# - 既存ファイルの上書きはしない
# - 何度実行しても安全（idempotent 寄り）
# ============================================

ROOT_DIR="${1:-.}"
LIB_DIR="${ROOT_DIR%/}/lib"

if [[ ! -d "$LIB_DIR" ]]; then
  echo "❌ lib/ が見つかりません: $LIB_DIR"
  exit 1
fi

# --- mv helper (git mv 優先) ---
_has_git=0
if command -v git >/dev/null 2>&1 && git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  _has_git=1
fi

move_file() {
  local src="$1"
  local dst="$2"

  if [[ ! -e "$src" ]]; then
    echo "… skip (not found): $src"
    return 0
  fi

  local dst_dir
  dst_dir="$(dirname "$dst")"
  mkdir -p "$dst_dir"

  if [[ -e "$dst" ]]; then
    echo "⚠️  skip (dest exists): $dst  (from: $src)"
    return 0
  fi

  if [[ $_has_git -eq 1 ]]; then
    git -C "$ROOT_DIR" mv "$src" "$dst"
  else
    mv "$src" "$dst"
  fi

  echo "✅ moved: $src -> $dst"
}

# --- ensure dirs ---
mkdir -p "$LIB_DIR/db" "$LIB_DIR/auth" "$LIB_DIR/hooks" "$LIB_DIR/utils" "$LIB_DIR/supabase"

echo "== Reorganizing $LIB_DIR =="
echo "git: $([[ $_has_git -eq 1 ]] && echo enabled || echo disabled)"
echo ""

# ============================================
# 1) Queries / DB access -> lib/db
# ============================================

move_file "$LIB_DIR/actQueries.ts"          "$LIB_DIR/db/acts.ts"
move_file "$LIB_DIR/performanceQueries.ts" "$LIB_DIR/db/performances.ts"
move_file "$LIB_DIR/songQueries.ts"        "$LIB_DIR/db/songs.ts"
move_file "$LIB_DIR/songAssets.ts"         "$LIB_DIR/db/songAssets.ts"
move_file "$LIB_DIR/venueQueries.ts"       "$LIB_DIR/db/venues.ts"

# actEvents.ts は DB層というよりドメイン寄りだが、現状の名前だと迷子になりやすいので db/acts.ts に統合予定なら移動。
# ただし後で中身を統合する前提で "db/actsEvents.ts" に一旦退避するのが安全。
move_file "$LIB_DIR/actEvents.ts"          "$LIB_DIR/db/actEvents.ts"

# performanceActions.ts は本来 app/.../actions.ts 側に寄せたいが、
# 一旦は db に移して server-only 化する方が「フロント直supabase排除」に効く。
move_file "$LIB_DIR/performanceActions.ts" "$LIB_DIR/db/performanceWrites.ts"

# ============================================
# 2) Auth -> lib/auth
# ============================================

move_file "$LIB_DIR/auth.ts"     "$LIB_DIR/auth/session.ts"
move_file "$LIB_DIR/authRole.ts" "$LIB_DIR/auth/roles.ts"

# ============================================
# 3) Hooks -> lib/hooks
# ============================================

move_file "$LIB_DIR/useCurrentAct.ts" "$LIB_DIR/hooks/useCurrentAct.ts"

# ============================================
# 4) Utils -> lib/utils
# ============================================

move_file "$LIB_DIR/dateUtils.ts"        "$LIB_DIR/utils/date.ts"
move_file "$LIB_DIR/performanceUtils.ts" "$LIB_DIR/utils/performance.ts"
move_file "$LIB_DIR/templates.ts"        "$LIB_DIR/utils/templates.ts"

# ============================================
# 5) Supabase clients
# ============================================

# 既存: lib/supabase/server.ts はそのまま
# supabaseClient.ts は「削除候補」だが、いきなり消すと作業が止まるので隔離して名前を変える
move_file "$LIB_DIR/supabaseClient.ts" "$LIB_DIR/supabase/client.legacy.ts"

# ============================================
# 6) api/ は現状維持（lib/api/*）
# ============================================

echo ""
echo "== Done =="
echo "Next:"
echo "  - import パス修正（acts.ts / performances.ts 等へ）"
echo "  - lib/supabase/client.legacy.ts の参照を検索して 0 にする"
echo "  - server-only を db/*.ts / auth/*.ts の先頭に入れていく（手動）"
