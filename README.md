# atli

Short, namespace-first local-AI CLI for on-prem Jira and Confluence.

`atli` is the command-line version of the `onprem-atlassian` Codex plugin. It uses:

- Local AI through Ollama by default.
- Any OpenAI-compatible local endpoint, such as LM Studio, with a flag.
- The same Docker MCP server as the plugin: `ghcr.io/sooperset/mcp-atlassian:latest`.
- The same 15 Jira, Confluence, and cross-product skills ported from the plugin.

## Requirements

- Node.js 20 or newer.
- Docker, if you want Jira/Confluence MCP tool access.
- A local model runtime:
  - Ollama at `http://127.0.0.1:11434`, or
  - an OpenAI-compatible local endpoint such as `http://127.0.0.1:1234/v1`.

## Install

From this folder:

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

```sh
# macOS / Linux
sh ./scripts/install.sh
```

If npm is available, you can also install directly:

```sh
npm install -g .
```

The install scripts create three commands:

- `atli`
- `atlas-ai`
- `onprem-atlassian`

`atli` is the primary command. The other two are compatibility aliases.

## Environment

Set these before using MCP-backed Jira or Confluence commands:

```powershell
$env:JIRA_PERSONAL_TOKEN = "<jira personal access token>"
$env:JIRA_URL = "<jira base url>"
$env:CONFLUENCE_URL = "<confluence base url>"
$env:CONFLUENCE_PERSONAL_TOKEN = "<confluence personal access token>"
```

```sh
export JIRA_PERSONAL_TOKEN="<jira personal access token>"
export JIRA_URL="<jira base url>"
export CONFLUENCE_URL="<confluence base url>"
export CONFLUENCE_PERSONAL_TOKEN="<confluence personal access token>"
```

Set `JIRA_URL` to your Jira base URL, for example `https://jira.example.com`.

## Local AI

Default Ollama usage:

```sh
atli ai chat "Draft a Jira bug for failed login after password reset" --model llama3.1
```

Use LM Studio or another local OpenAI-compatible endpoint:

```sh
atli ai chat "Summarize this release plan" \
  --provider openai-compatible \
  --base-url http://127.0.0.1:1234/v1 \
  --model local-model
```

You can also configure defaults with environment variables:

```sh
export ONPREM_ATLASSIAN_AI_PROVIDER=ollama
export ONPREM_ATLASSIAN_MODEL=llama3.1
export ONPREM_ATLASSIAN_AI_BASE_URL=http://127.0.0.1:11434
```

## Commands

```sh
atli doctor
atli doctor --mcp
atli skills list
atli skills show jira-issue-search
atli ai chat "Draft acceptance criteria for a payment retry story"
atli ai ask "Find open blockers in project ABC"
atli jira skills
atli jira ask "Find open blockers in project ABC"
atli jira search "project = ABC ORDER BY updated DESC"
atli jira triage "active sprint for team ABC"
atli jira draft "bug for failed login after password reset"
atli confluence skills
atli confluence ask "Summarize the runbooks for service ABC"
atli confluence search "release process"
atli confluence draft "runbook for payment retry failures" --no-mcp
atli mcp tools
atli mcp call jira_search --args '{"jql":"project = ABC ORDER BY updated DESC"}'
```

`ai ask`, `jira ask`, and `confluence ask` run a local-AI agent loop. By default they can read from Jira/Confluence through MCP, but they will not perform writes unless you pass:

```sh
atli ai ask "Comment on ABC-123 with this update: ..." --write-ok
```

## Ported Skills

The CLI contains exact copies of the plugin skills:

- `atlassian-cross-product-research`
- `atlassian-reporting`
- `confluence-knowledge-synthesis`
- `confluence-page-authoring`
- `confluence-page-maintenance`
- `confluence-runbooks`
- `confluence-search`
- `jira-admin-lookup`
- `jira-incident-management`
- `jira-issue-search`
- `jira-issue-triage`
- `jira-issue-write`
- `jira-release-reporting`
- `jira-sprint-planning`
- `jira-ticket-authoring`

Verify the packaged skills against the checked-in manifest:

```sh
node ./scripts/verify-skills.mjs
```

When working from the original plugin workspace, sync skills from the plugin into the CLI:

```sh
node ./scripts/sync-skills.mjs
```

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\uninstall.ps1
```

```sh
sh ./scripts/uninstall.sh
```
