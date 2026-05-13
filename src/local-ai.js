const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
const DEFAULT_OPENAI_COMPATIBLE_URL = "http://127.0.0.1:1234/v1";

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`AI request failed (${response.status}): ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`AI response was not JSON: ${text.slice(0, 500)}`);
  }
}

export function aiDefaults(flags = {}) {
  const provider = flags.provider || process.env.ONPREM_ATLASSIAN_AI_PROVIDER || "ollama";
  const model = flags.model || process.env.ONPREM_ATLASSIAN_MODEL || process.env.OLLAMA_MODEL || "llama3.1";
  const baseUrl = flags["base-url"] || process.env.ONPREM_ATLASSIAN_AI_BASE_URL ||
    (provider === "openai-compatible" ? DEFAULT_OPENAI_COMPATIBLE_URL : DEFAULT_OLLAMA_URL);
  return {
    provider,
    model,
    baseUrl,
    apiKey: flags["api-key"] || process.env.ONPREM_ATLASSIAN_AI_API_KEY || process.env.OPENAI_API_KEY || "",
    temperature: Number(flags.temperature ?? process.env.ONPREM_ATLASSIAN_TEMPERATURE ?? 0.2)
  };
}

export async function chat(messages, options = {}) {
  const config = aiDefaults(options);
  if (config.provider === "ollama") return chatOllama(messages, config, options);
  if (config.provider === "openai-compatible") return chatOpenAiCompatible(messages, config, options);
  throw new Error(`Unsupported AI provider '${config.provider}'. Use ollama or openai-compatible.`);
}

export async function chatOllama(messages, config, options = {}) {
  const body = {
    model: config.model,
    messages,
    stream: false,
    options: {
      temperature: config.temperature
    }
  };
  if (options.json) body.format = "json";

  const response = await fetch(joinUrl(config.baseUrl, "/api/chat"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await readJsonResponse(response);
  return payload.message?.content || "";
}

export async function chatOpenAiCompatible(messages, config, options = {}) {
  const headers = { "content-type": "application/json" };
  if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;
  const body = {
    model: config.model,
    messages,
    temperature: config.temperature
  };
  if (options.json) body.response_format = { type: "json_object" };

  const response = await fetch(joinUrl(config.baseUrl, "/chat/completions"), {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const payload = await readJsonResponse(response);
  return payload.choices?.[0]?.message?.content || "";
}

export async function checkAi(options = {}) {
  const config = aiDefaults(options);
  const endpoint = config.provider === "openai-compatible" ? "/models" : "/api/tags";
  const headers = {};
  if (config.provider === "openai-compatible" && config.apiKey) {
    headers.authorization = `Bearer ${config.apiKey}`;
  }
  let response;
  try {
    response = await fetch(joinUrl(config.baseUrl, endpoint), { headers });
  } catch {
    throw new Error(`unreachable at ${config.baseUrl}`);
  }
  if (!response.ok) {
    throw new Error(`Local AI endpoint returned ${response.status}`);
  }
  return { provider: config.provider, model: config.model, baseUrl: config.baseUrl };
}
