#!/usr/bin/env bash
branch="$(git branch --show-current 2>/dev/null || true)"
dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
config='.claude/project.config.json'
echo "Project workflow active. Branch: $branch. Dirty files: $dirty. Config: $config. Never push automatically."

# The configured base branch has silently pointed at a non-existent branch
# before. Catch it at session start instead of halfway through a feature.
if [[ -f "$config" ]]; then
  base="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('$config','utf8')).defaultBaseBranch||'')" 2>/dev/null || true)"
  if [[ -n "$base" ]] && ! git rev-parse --verify --quiet "$base" >/dev/null 2>&1; then
    echo "WARNING: defaultBaseBranch '$base' does not exist in this repository. Fix $config before branching."
  fi
fi
