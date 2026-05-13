import { aiDefaults, chat, checkAi } from "./local-ai.js";
import { loadSkills, filterSkills, skillsPrompt } from "./skills.js";
import { commandExists, parseFlags, printTable, asArray } from "./util.js";
import { loadMcpServerConfig, withMcp } from "./mcp-client.js";
import { runAgent } from "./agent.js";

const CLI_NAME = "atli";
const VERSION = "0.2.0";

const HELP = `atli - local-AI CLI for on-prem Jira and Confluence

Usage:
  atli ai chat "prompt" [--model llama3.1] [--provider ollama]
  atli ai ask "question" [--model llama3.1] [--no-mcp] [--write-ok]
  atli jira skills
  atli jira ask "question"
  atli jira search "query or JQL"
  atli jira triage "scope"
  atli jira draft "ticket brief"
  atli confluence skills
  atli confluence ask "question"
  atli confluence search "query"
  atli confluence draft "page brief"
  atli skills list
  atli skills show <name>
  atli mcp tools
  atli mcp call <tool-name> --args '{"key":"value"}'
  atli doctor [--mcp]

Compatibility aliases:
  atlas-ai, onprem-atlassian

Local AI:
  Default provider is Ollama at http://127.0.0.1:11434 with model llama3.1.
  Use --provider openai-compatible --base-url http://127.0.0.1:1234/v1 for LM Studio or similar.

Environment:
  JIRA_PERSONAL_TOKEN, CONFLUENCE_URL, and CONFLUENCE_PERSONAL_TOKEN are inherited by Docker MCP.
`;

function requireArg(value, label) {
  if (!value) throw new Error(`Missing ${label}.`);
  return value;
}

function flagTokens(args) {
  const tokens = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) continue;
    tokens.push(token);
    if (!token.includes("=") && args[index + 1] && !args[index + 1].startsWith("--")) {
      tokens.push(args[index + 1]);
      index += 1;
    }
  }
  return tokens;
}

function parseJsonArg(value, label = "JSON") {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} was not valid JSON: ${error.message}`);
  }
}

export async function main(argv) {
  const args = argv.slice(2);
  const command = args[0] || "help";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(HELP);
    return;
  }
  if (command === "version" || command === "--version") {
    console.log(VERSION);
    return;
  }

  if (command === "skills") return skillsCommand(args.slice(1));
  if (command === "confluence") return domainCommand("confluence", args.slice(1));
  if (command === "jira") return domainCommand("jira", args.slice(1));
  if (command === "ai") return aiNamespaceCommand(args.slice(1));
  if (command === "ask") return askCommand(args.slice(1));
  if (command === "mcp") return mcpCommand(args.slice(1));
  if (command === "doctor") return doctorCommand(args.slice(1));

  throw new Error(`Unknown command '${command}'. Run ${CLI_NAME} help.`);
}

async function aiNamespaceCommand(args) {
  const subcommand = args[0] || "chat";

  if (subcommand === "chat" || subcommand === "prompt") {
    return aiCommand(args.slice(1));
  }

  if (subcommand === "ask") {
    return askCommand(args.slice(1));
  }

  if (subcommand === "doctor") {
    return doctorCommand(args.slice(1));
  }

  return aiCommand(args);
}

function domainSkillNames(domain) {
  if (domain === "confluence") {
    return [
      "confluence-search",
      "confluence-page-authoring",
      "confluence-page-maintenance",
      "confluence-runbooks",
      "confluence-knowledge-synthesis",
      "atlassian-cross-product-research",
      "atlassian-reporting"
    ];
  }

  if (domain === "jira") {
    return [
      "jira-issue-search",
      "jira-issue-triage",
      "jira-issue-write",
      "jira-ticket-authoring",
      "jira-sprint-planning",
      "jira-release-reporting",
      "jira-incident-management",
      "jira-admin-lookup",
      "atlassian-cross-product-research",
      "atlassian-reporting"
    ];
  }

  return [];
}

async function domainCommand(domain, args) {
  const subcommand = args[0] || "skills";
  const skillNames = domainSkillNames(domain);
  const skills = await loadSkills();
  const selectedSkills = skills.filter((skill) => skillNames.includes(skill.name));

  if (subcommand === "skills") {
    printTable(selectedSkills.map((skill) => ({
      name: skill.name,
      description: skill.description
    })), [
      { key: "name", label: "Skill" },
      { key: "description", label: "Description" }
    ]);
    return;
  }

  if (subcommand === "ask") {
    const rest = args.slice(1);
    return askCommand([...rest, ...skillNames.flatMap((name) => ["--skill", name])]);
  }

  if (domain === "confluence" && subcommand === "search") {
    const rest = args.slice(1);
    const flags = parseFlags(rest);
    const query = requireArg(flags._.join(" ").trim(), "Confluence search query");
    return askCommand([
      `Search Confluence for: ${query}`,
      "--skill",
      "confluence-search",
      "--skill",
      "confluence-knowledge-synthesis",
      ...flagTokens(rest)
    ]);
  }

  if (domain === "confluence" && subcommand === "draft") {
    const rest = args.slice(1);
    const flags = parseFlags(rest);
    const brief = requireArg(flags._.join(" ").trim(), "Confluence page brief");
    return askCommand([
      `Draft Confluence page content for: ${brief}`,
      "--skill",
      "confluence-page-authoring",
      "--skill",
      "confluence-runbooks",
      ...flagTokens(rest)
    ]);
  }

  if (domain === "jira" && subcommand === "search") {
    const rest = args.slice(1);
    const flags = parseFlags(rest);
    const query = requireArg(flags._.join(" ").trim(), "Jira search query or JQL");
    return askCommand([
      `Search Jira for: ${query}`,
      "--skill",
      "jira-issue-search",
      ...flagTokens(rest)
    ]);
  }

  if (domain === "jira" && subcommand === "triage") {
    const rest = args.slice(1);
    const flags = parseFlags(rest);
    const scope = requireArg(flags._.join(" ").trim(), "Jira triage scope");
    return askCommand([
      `Triage Jira work for: ${scope}`,
      "--skill",
      "jira-issue-triage",
      "--skill",
      "jira-issue-search",
      ...flagTokens(rest)
    ]);
  }

  if (domain === "jira" && subcommand === "draft") {
    const rest = args.slice(1);
    const flags = parseFlags(rest);
    const brief = requireArg(flags._.join(" ").trim(), "Jira ticket brief");
    return askCommand([
      `Draft Jira ticket content for: ${brief}`,
      "--skill",
      "jira-ticket-authoring",
      "--no-mcp",
      ...flagTokens(rest)
    ]);
  }

  throw new Error(`Unknown ${domain} command '${subcommand}'.`);
}

async function skillsCommand(args) {
  const subcommand = args[0] || "list";
  const skills = await loadSkills();

  if (subcommand === "list") {
    printTable(skills.map((skill) => ({
      name: skill.name,
      description: skill.description
    })), [
      { key: "name", label: "Skill" },
      { key: "description", label: "Description" }
    ]);
    return;
  }

  if (subcommand === "show") {
    const name = requireArg(args[1], "skill name");
    const skill = skills.find((item) => item.name === name || item.dirName === name);
    if (!skill) throw new Error(`Skill '${name}' was not found.`);
    console.log(skill.text);
    return;
  }

  throw new Error(`Unknown skills command '${subcommand}'.`);
}

async function aiCommand(args) {
  const flags = parseFlags(args);
  const prompt = flags._.join(" ").trim();
  requireArg(prompt, "prompt");

  const allSkills = await loadSkills();
  const selected = filterSkills(allSkills, asArray(flags.skill));
  const messages = [
    {
      role: "system",
      content: `You are a local AI assistant for on-prem Jira and Confluence. Follow these ported skills:\n\n${skillsPrompt(selected)}`
    },
    { role: "user", content: prompt }
  ];
  console.log(await chat(messages, flags));
}

async function askCommand(args) {
  const flags = parseFlags(args);
  const prompt = flags._.join(" ").trim();
  requireArg(prompt, "question");

  const allSkills = await loadSkills();
  const selected = filterSkills(allSkills, asArray(flags.skill));
  const skillsText = skillsPrompt(selected.length ? selected : allSkills);
  const maxSteps = Number(flags["max-steps"] || 5);
  const writeOk = Boolean(flags["write-ok"]);

  if (flags["no-mcp"]) {
    const answer = await runAgent({ prompt, skillsText, aiOptions: flags, maxSteps, writeOk });
    console.log(answer);
    return;
  }

  const answer = await withMcp((mcpClient) => {
    return runAgent({ prompt, skillsText, mcpClient, aiOptions: flags, maxSteps, writeOk });
  });
  console.log(answer);
}

async function mcpCommand(args) {
  const subcommand = args[0] || "tools";

  if (subcommand === "config") {
    const config = await loadMcpServerConfig();
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  if (subcommand === "tools") {
    await withMcp(async (client) => {
      const tools = await client.listTools();
      printTable(tools.map((tool) => ({
        name: tool.name,
        description: tool.description || ""
      })), [
        { key: "name", label: "Tool" },
        { key: "description", label: "Description" }
      ]);
    });
    return;
  }

  if (subcommand === "call") {
    const toolName = requireArg(args[1], "tool name");
    const flags = parseFlags(args.slice(2));
    const toolArgs = parseJsonArg(flags.args, "--args");
    await withMcp(async (client) => {
      const result = await client.callTool(toolName, toolArgs);
      console.log(JSON.stringify(result, null, 2));
    });
    return;
  }

  throw new Error(`Unknown mcp command '${subcommand}'.`);
}

async function doctorCommand(args) {
  const flags = parseFlags(args);
  const aiConfig = aiDefaults(flags);

  const checks = [];
  checks.push({ check: "Node.js", status: Number(process.versions.node.split(".")[0]) >= 20 ? "ok" : "needs Node >=20" });
  checks.push({ check: "Docker CLI", status: await commandExists("docker") ? "ok" : "missing" });
  checks.push({ check: "JIRA_PERSONAL_TOKEN", status: process.env.JIRA_PERSONAL_TOKEN ? "set" : "missing" });
  checks.push({ check: "CONFLUENCE_URL", status: process.env.CONFLUENCE_URL ? "set" : "missing" });
  checks.push({ check: "CONFLUENCE_PERSONAL_TOKEN", status: process.env.CONFLUENCE_PERSONAL_TOKEN ? "set" : "missing" });

  try {
    await checkAi(flags);
    checks.push({ check: `${aiConfig.provider} ${aiConfig.model}`, status: "ok" });
  } catch (error) {
    checks.push({ check: `${aiConfig.provider} ${aiConfig.model}`, status: error.message });
  }

  if (flags.mcp) {
    try {
      await withMcp(async (client) => {
        const tools = await client.listTools();
        checks.push({ check: "MCP tools", status: `${tools.length} tools` });
      }, { timeoutMs: 45000 });
    } catch (error) {
      checks.push({ check: "MCP tools", status: error.message });
    }
  }

  printTable(checks, [
    { key: "check", label: "Check" },
    { key: "status", label: "Status" }
  ]);
}
