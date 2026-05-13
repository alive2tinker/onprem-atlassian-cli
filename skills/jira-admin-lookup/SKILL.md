---
name: jira-admin-lookup
description: Look up Jira projects, users, issue types, statuses, fields, priorities, versions, components, boards, and workflows.
---

# Jira Admin Lookup

Use this skill when the user asks what Jira projects, fields, statuses, users, versions, components, or workflow options exist.

## Workflow

1. Query the relevant Jira metadata through the onprem-atlassian MCP server.
2. Return exact names and IDs when useful for follow-up writes.
3. Explain constraints that affect the requested action, such as unavailable transition names or required fields.

## Guardrails

- This skill is read-oriented.
- Do not perform administrative changes unless the user explicitly requests a write and the MCP server supports it.
