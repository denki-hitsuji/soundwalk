#!/usr/bin/env zsh
set -euo pipefail

# ============================================
# lib 再編に伴う import パス自動置換
# - default: dry-run（変更しない）
# - --apply: 実際に書き換える
# - LIB_ALIAS: "@/lib" を別の alias にしたい場合に指定
#   例) LIB_ALIAS="~/lib" ./scripts/replace-lib-imports.zsh --apply
# ============================================

ROOT_DIR="."
APPLY=0
LIB_ALIAS="${LIB_ALIAS:-@/lib}"   # デフォルトは Next.js 的な "@/lib"

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --root=*) ROOT_DIR="${arg#*=}" ;;
    --alias=*) LIB_ALIAS="${arg#*=}" ;;
    --help|-h)
      echo "Usage:"
      echo "  $0 [--apply] [--root=.] [--alias=@/lib]"
      echo "Env:"
      echo "  LIB_ALIAS=@/lib  (default)"
      exit 0
      ;;
    *)
      # allow positional root
      if [[ "$arg" != --* ]]; then
        ROOT_DIR="$arg"
      else
        echo "Unknown option: $arg" >&2
        exit 1
      fi
      ;;
  esac
done

cd "$ROOT_DIR"

if ! command -v rg >/dev/null 2>&1; then
  echo "❌ ripgrep (rg) が必要です"
  exit 1
fi

if ! command -v perl >/dev/null 2>&1; then
  echo "❌ perl が必要です（macOS なら基本入っています）"
  exit 1
fi

# 置換対象ファイル（必要なら増やしてOK）
FILE_GLOBS=(
  "--glob" "**/*.ts"
  "--glob" "**/*.tsx"
  "--glob" "**/*.js"
  "--glob" "**/*.jsx"
  "--glob" "**/*.mjs"
  "--glob" "**/*.cjs"
)

# 置換マップ
# - alias import: "@/lib/db/acts" -> "@/lib/db/acts"
# - relative import: "../lib/actQueries" などもある程度拾う（lib/actQueries を含むもの）
typeset -a RULES
RULES=(
  # --- old -> new (alias) ---
  "${LIB_ALIAS}/actQueries:${LIB_ALIAS}/db/acts"
  "${LIB_ALIAS}/performanceQueries:${LIB_ALIAS}/db/performances"
  "${LIB_ALIAS}/songQueries:${LIB_ALIAS}/db/songs"
  "${LIB_ALIAS}/songAssets:${LIB_ALIAS}/db/songAssets"
  "${LIB_ALIAS}/venueQueries:${LIB_ALIAS}/db/venues"
  "${LIB_ALIAS}/actEvents:${LIB_ALIAS}/db/actEvents"
  "${LIB_ALIAS}/performanceActions:${LIB_ALIAS}/db/performanceWrites"
  "${LIB_ALIAS}/auth:${LIB_ALIAS}/auth/session"
  "${LIB_ALIAS}/authRole:${LIB_ALIAS}/auth/roles"
  "${LIB_ALIAS}/useCurrentAct:${LIB_ALIAS}/hooks/useCurrentAct"
  "${LIB_ALIAS}/dateUtils:${LIB_ALIAS}/utils/date"
  "${LIB_ALIAS}/performanceUtils:${LIB_ALIAS}/utils/performance"
  "${LIB_ALIAS}/templates:${LIB_ALIAS}/utils/templates"
  "${LIB_ALIAS}/supabaseClient:${LIB_ALIAS}/supabase/client.legacy"

  # --- relative-ish (汎用) ---
  # 例: ../../lib/actQueries -> ../../lib/db/acts
  "lib/actQueries:lib/db/acts"
  "lib/performanceQueries:lib/db/performances"
  "lib/songQueries:lib/db/songs"
  "lib/songAssets:lib/db/songAssets"
  "lib/venueQueries:lib/db/venues"
  "lib/actEvents:lib/db/actEvents"
  "lib/performanceActions:lib/db/performanceWrites"
  "lib/auth:lib/auth/session"
  "lib/authRole:lib/auth/roles"
  "lib/useCurrentAct:lib/hooks/useCurrentAct"
  "lib/dateUtils:lib/utils/date"
  "lib/performanceUtils:lib/utils/performance"
  "lib/templates:lib/utils/templates"
  "lib/supabaseClient:lib/supabase/client.legacy"
)

# 置換候補をざっくり出す（dry-run用）
echo "== replace-lib-imports =="
echo "root: $(pwd)"
echo "apply: $APPLY"
echo "alias: $LIB_ALIAS"
echo ""

print_hits() {
  local needle="$1"
  local count
  count="$(rg -n "${FILE_GLOBS[@]}" --fixed-strings "$needle" . | wc -l | tr -d ' ')"
  if [[ "$count" != "0" ]]; then
    echo "  hit: $needle  ($count lines)"
  fi
}

echo "== Scan hits =="
for rule in "${RULES[@]}"; do
  local old="${rule%%:*}"
  print_hits "$old"
done

if [[ "$APPLY" -ne 1 ]]; then
  echo ""
  echo "Dry-run only. To apply changes:"
  echo "  $0 --apply --root=. --alias='$LIB_ALIAS'"
  exit 0
fi

echo ""
echo "== Applying replacements =="

# 実置換（ファイルごとに in-place）
# - import 文だけを狙うのが理想だが、まずは「壊さない範囲の固定置換」を優先。
# - もし文字列やコメントに同じパスが出ても、今回の目的上はむしろ置換してOK（リンク整合性）。
for rule in "${RULES[@]}"; do
  old="${rule%%:*}"
  new="${rule#*:}"

  # old を含むファイルだけを対象にする（高速・安全）
  files=("${(@f)$(rg -l "${FILE_GLOBS[@]}" --fixed-strings "$old" . || true)}")
  if (( ${#files[@]} == 0 )); then
    continue
  fi

  echo "-> $old  =>  $new"
  # perl で固定置換（正規表現メタ文字をエスケープ）
  # \Q...\E で old をリテラル扱いにする
  perl -pi -e "s/\\Q${old}\\E/${new}/g" -- "${files[@]}"
done

echo ""
echo "✅ Done. 次は diff を見てください："
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "  git diff"
else
  echo "  （git 管理でないなら）rg で import を再スキャンして確認"
fi
