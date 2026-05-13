---
name: jira-issue-triage
description: Triage Jira issues by severity, priority, ownership, blockers, stale activity, SLA risk, duplicates, or next action.
---

# Jira Issue Triage

Use this skill when the user asks what needs attention, what is blocked, what is stale, or how to prioritize Jira work.

## Workflow

1. Search the relevant Jira issue set using project, board, sprint, component, label, assignee, or date hints.
2. Read issue details and recent comments for the highest-risk candidates.
3. Identify blockers, missing owners, stale status, aging high-priority items, duplicate signals, and unclear acceptance criteria.
4. Produce a concise triage list with recommended next actions.

## Output

Lead with the highest-risk items. Include issue key, short reason, and suggested action for each.

## Guardrails

- Do not change priority, status, assignee, or comments unless the user explicitly asks.
- If confidence is limited because comments or linked issues are missing, say so briefly.
