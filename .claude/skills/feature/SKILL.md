---
name: feature
description: End-to-end workflow for starting and implementing a new feature safely on a feature branch with exploration, incremental tests, local commits, review, and retrospective.
argument-hint: "<feature goal>"
---
Execute this workflow for `$ARGUMENTS`:

1. **Safety** — inspect status and current branch. Require a clean tree. Never stash or discard user work. Determine base branch from project config.
2. **Explore** — delegate to `repo-scout`. Find analogous logic before proposing files.
3. **Scope** — write 2–6 acceptance criteria and split work into independently testable subtasks.
4. **Branch** — verify the configured base branch actually exists here (`git rev-parse --verify <base>`) before creating from it; if it does not, stop and ask rather than silently falling back. Then create `feature/<short-kebab-slug>` from it. Do not push.
5. **Implement** — for each subtask:
   - modify the smallest predictable location;
   - run the narrowest relevant test via `test-runner`;
   - run lint as soon as new hooks or components compile — several rules are errors here and catching one late means a rewrite;
   - inspect `git diff` and remove accidental changes;
   - commit locally using `.claude/scripts/safe-commit.ps1 <type> <message>`.
6. **Verify** — invoke `/verify-change`; UI changes require the Playwright skill and `ui-verifier`.
7. **Review** — delegate to `change-reviewer`; fix blocking findings and retest.
8. **Close** — summarize acceptance evidence, commits, residual risks, and explicitly state `Not pushed`.
9. **Learn** — append a compact entry to `docs/session-log.md`; invoke `/retro` after meaningful friction.

Do not combine unrelated cleanup with the feature.
