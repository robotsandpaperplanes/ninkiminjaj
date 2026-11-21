# MTS Link Admin — Codex Instructions

## Project
Interactive prototype for an enterprise collaboration platform's administration panel.
Treat the current repository and approved feature specifications as source of truth.

## Global rules
- Write code and technical documentation in English; keep user-facing UI copy in Russian.
- Preserve behavior, styles and data contracts outside the requested task.
- Follow existing components, design tokens and project patterns. No unrelated refactoring.
- Never invent security/RBAC/SSO/federation policy; flag missing approval or requirements.
- Use synthetic data only; never add real customer records or secrets.
- Inspect only files and specs relevant to the request; avoid full-repo exploration by default.
- Keep changes focused and reviewable. Run relevant checks when available.

## Delegation and efficiency
- Main agent handles simple tasks directly. Do not spawn specialists by default.
- Spawn a single specialized subagent only if it adds value; two only for independent tasks.
- Do not run all available agents for each request or allow overlapping file edits.
- Use qa_reviewer for material regression risks or when explicitly requested.
- For CSS-only requests, preserve UI strings and logic; for localization-only requests, preserve CSS and logic.

## Completion
Report files changed, relevant verification actually run, and outstanding issues concisely.
