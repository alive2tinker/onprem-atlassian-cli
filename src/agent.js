import { chat } from "./local-ai.js";
import { truncateText } from "./util.js";

function extractJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error(`Model did not return JSON: ${trimmed.slice(0, 500)}`);
  }
}

function toolSummary(tools) {
  return tools.map((tool) => {
    const schema = tool.inputSchema ? JSON.stringify(tool.inputSchema) : "{}";
    return `- ${tool.name}: ${tool.description || "No description"}\n  inputSchema: ${schema}`;
  }).join("\n");
}

export async function runAgent({ prompt, skillsText, mcpClient, aiOptions, maxSteps = 5, writeOk = false }) {
  const tools = mcpClient ? await mcpClient.listTools() : [];
  const writePolicy = writeOk
    ? "The user allowed writes for this run. Still prefer the smallest exact write and explain it."
    : "Do not perform Jira or Confluence write operations. If a write is needed, stop and ask for explicit permission.";

  const system = [
    "You are On-Prem Atlassian CLI, a local-AI assistant for internal Jira and Confluence.",
    "Follow the ported skill instructions exactly.",
    writePolicy,
    "When you need an MCP tool, respond with a single JSON object:",
    "{\"action\":\"tool\",\"tool\":\"tool_name\",\"arguments\":{},\"reason\":\"why this tool is needed\"}",
    "When you are ready to answer, respond with a single JSON object:",
    "{\"action\":\"final\",\"answer\":\"your concise answer\"}",
    "Do not wrap JSON in Markdown.",
    "",
    "# Ported Skills",
    skillsText,
    "",
    "# Available MCP Tools",
    tools.length ? toolSummary(tools) : "No MCP tools are available in this run."
  ].join("\n");

  const messages = [
    { role: "system", content: system },
    { role: "user", content: prompt }
  ];

  for (let step = 0; step < maxSteps; step += 1) {
    const raw = await chat(messages, { ...aiOptions, json: true });
    let decision;
    try {
      decision = extractJson(raw);
    } catch {
      return raw;
    }

    if (decision.action === "final") {
      return decision.answer || "";
    }

    if (decision.action !== "tool") {
      messages.push({ role: "assistant", content: raw });
      messages.push({ role: "user", content: "Use action=tool or action=final only." });
      continue;
    }

    if (!mcpClient) {
      return `The local model requested MCP tool '${decision.tool}', but MCP is disabled for this run.`;
    }

    const toolName = decision.tool;
    const toolArgs = decision.arguments || {};
    const result = await mcpClient.callTool(toolName, toolArgs);
    messages.push({ role: "assistant", content: JSON.stringify(decision) });
    messages.push({
      role: "user",
      content: `Tool result for ${toolName}:\n${truncateText(result, 20000)}`
    });
  }

  const final = await chat([
    ...messages,
    { role: "user", content: "Give the best final answer from the evidence above. Return JSON with action=final." }
  ], { ...aiOptions, json: true });
  try {
    return extractJson(final).answer || final;
  } catch {
    return final;
  }
}
