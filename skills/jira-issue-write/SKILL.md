---
name: jira-issue-write
description: Create or update Jira issues, comments, summaries, descriptions, labels, assignees, priorities, links, or transitions after explicit user intent.
---

# Jira Issue Write

Use this skill when the user asks to create, edit, comment on, link, assign, label, prioritize, or transition Jira issues.

## Workflow

1. Read the target issue or project metadata before writing.
2. Restate the intended change when it is potentially destructive, broad, or user-visible.
3. Use the onprem-atlassian MCP Jira write tools for the smallest exact change.
4. Verify the updated issue after writing.
5. Report what changed with issue keys.

## Guardrails

- Never guess project keys, issue types, transition names, or assignees when ambiguity could create the wrong ticket.
- Ask for confirmation before closing, deleting, bulk transitioning, or overwriting substantial descriptions.
- Preserve existing formatting and fields unless the user asks to replace them.
