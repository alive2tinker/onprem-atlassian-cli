---
name: jira-issue-search
description: Search on-prem Jira with JQL, issue keys, project filters, assignees, statuses, labels, or free-text intent through the onprem-atlassian MCP server.
---

# Jira Issue Search

Use this skill when the user asks to find, list, filter, inspect, or summarize Jira issues.

## Workflow

1. Translate the user's request into the narrowest useful Jira query.
2. Prefer JQL when the request names projects, statuses, assignees, labels, dates, issue types, priorities, or issue keys.
3. Use the onprem-atlassian MCP Jira search/read tools.
4. Return issue keys, summaries, status, assignee, updated date, and blockers when relevant.
5. If results are broad, group by project, status, priority, or owner instead of dumping a flat list.

## Guardrails

- Confirm before making changes; this skill is read-oriented.
- Do not expose tokens, internal raw payloads, or unrelated comments.
- Use exact issue keys in final answers so users can follow up.
