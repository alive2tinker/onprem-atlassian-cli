---
name: confluence-search
description: Search on-prem Confluence spaces, pages, titles, labels, ancestors, contributors, and page content through the onprem-atlassian MCP server.
---

# Confluence Search

Use this skill when the user asks to find, inspect, compare, or summarize Confluence content.

## Workflow

1. Translate the user's intent into a focused Confluence search.
2. Prefer exact title, space, label, ancestor, and contributor filters when available.
3. Read the most relevant pages before answering.
4. Summarize with page titles, space keys, last updated dates, and links or IDs when available.

## Guardrails

- Do not update pages through this skill.
- Note when search results look stale, duplicated, or incomplete.
