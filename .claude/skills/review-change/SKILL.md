---
name: review-change
description: Performs an independent pre-completion review of the current branch diff and verifies fixes for blocking findings.
---
Delegate to `change-reviewer`. Treat correctness, data loss, security, regressions, broken tests, and violation of acceptance criteria as blocking. Fix blocking findings, rerun focused verification, and request one concise re-review. Do not churn on subjective style.
