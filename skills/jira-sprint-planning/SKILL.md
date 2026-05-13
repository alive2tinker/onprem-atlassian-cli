---
name: jira-sprint-planning
description: Review Jira boards, backlogs, active sprints, sprint readiness, capacity signals, carryover, blockers, and sprint commitments.
---

# Jira Sprint Planning

Use this skill when the user asks about sprint planning, current sprint health, backlog readiness, carryover, or board status.

## Workflow

1. Discover the relevant project, board, sprint, or team from the request.
2. Read active and upcoming sprint issues where available.
3. Group issues by status, assignee, priority, story points, blocked state, and readiness.
4. Highlight scope risk, unassigned work, stale items, spillover candidates, and missing estimates.
5. Suggest a practical sprint plan or status summary.

## Guardrails

- Do not move issues between sprints or change estimates without explicit instruction.
- If board/sprint APIs are unavailable, fall back to JQL using sprint fields and status categories.
