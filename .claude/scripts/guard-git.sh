#!/usr/bin/env bash
set -euo pipefail
input="$(cat)"
command="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
if printf '%s' "$command" | grep -Eiq '(^|[;&|][[:space:]]*)git[[:space:]]+(push|merge|rebase)|git[[:space:]]+reset[[:space:]]+--hard|git[[:space:]]+clean[[:space:]]+-[^ ]*f'; then
  echo 'Blocked by project policy: destructive or remote git command requires explicit user execution.' >&2
  exit 2
fi
exit 0
