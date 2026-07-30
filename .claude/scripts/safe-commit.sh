#!/usr/bin/env bash
set -euo pipefail
type="${1:?type required}"; shift
message="${*:?message required}"
case "$type" in feat|fix|test|refactor|docs|chore) ;; *) echo 'Invalid commit type' >&2; exit 2;; esac
branch="$(git branch --show-current)"
[[ -n "$branch" ]] || { echo 'Detached HEAD' >&2; exit 2; }
[[ ! "$branch" =~ ^(main|master|develop)$ && ! "$branch" =~ ^release[/_-] ]] || { echo 'Protected branch' >&2; exit 2; }
[[ -n "$(git status --porcelain)" ]] || { echo 'Nothing to commit' >&2; exit 2; }
git add --all
git diff --cached --check
git commit -m "$type: $message"
