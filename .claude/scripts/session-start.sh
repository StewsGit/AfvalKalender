#!/usr/bin/env bash
branch="$(git branch --show-current 2>/dev/null || true)"
dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
echo "Project workflow active. Branch: $branch. Dirty files: $dirty. Never push automatically."
