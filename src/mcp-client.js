import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { mcpConfigPath } from "./paths.js";

const DEFAULT_PROTOCOL_VERSION = "2024-11-05";

export async function loadMcpServerConfig(serverName = "onprem-atlassian") {
  const raw = await readFile(mcpConfigPath, "utf8");
  const payload = JSON.parse(raw);
  const server = payload.mcpServers?.[serverName];
  if (!server) throw new Error(`MCP server '${serverName}' not found in ${mcpConfigPath}`);
  return server;
}

export class McpClient {
  constructor(serverConfig, options = {}) {
    this.serverConfig = serverConfig;
    this.timeoutMs = options.timeoutMs || 30000;
    this.child = null;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
    this.stderr = "";
  }

  async connect() {
    const { command, args = [], env = {} } = this.serverConfig;
    this.child = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"],
      shell: false
    });

    this.child.stdout.on("data", (chunk) => this.onData(chunk));
    this.child.stderr.on("data", (chunk) => {
      this.stderr += chunk.toString("utf8");
    });
    this.child.on("error", (error) => {
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    });
    this.child.on("exit", (code, signal) => {
      const reason = `MCP server exited code=${code} signal=${signal}. ${this.stderr}`.trim();
      for (const pending of this.pending.values()) pending.reject(new Error(reason));
      this.pending.clear();
    });

    await this.request("initialize", {
      protocolVersion: DEFAULT_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: "onprem-atlassian-cli",
        version: "0.1.0"
      }
    });
    this.notify("notifications/initialized", {});
  }

  async listTools() {
    const result = await this.request("tools/list", {});
    return result.tools || [];
  }

  async callTool(name, args = {}) {
    return this.request("tools/call", { name, arguments: args });
  }

  request(method, params = {}) {
    if (!this.child) throw new Error("MCP client is not connected.");
    const id = this.nextId;
    this.nextId += 1;
    const message = { jsonrpc: "2.0", id, method, params };

    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timed out: ${method}`));
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
    });

    this.writeMessage(message);
    return promise;
  }

  notify(method, params = {}) {
    if (!this.child) throw new Error("MCP client is not connected.");
    this.writeMessage({ jsonrpc: "2.0", method, params });
  }

  writeMessage(message) {
    const body = Buffer.from(JSON.stringify(message), "utf8");
    const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "ascii");
    this.child.stdin.write(Buffer.concat([header, body]));
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd < 0) return;

      const header = this.buffer.slice(0, headerEnd).toString("ascii");
      const match = /content-length:\s*(\d+)/i.exec(header);
      if (!match) {
        this.buffer = Buffer.alloc(0);
        return;
      }

      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + length;
      if (this.buffer.length < bodyEnd) return;

      const body = this.buffer.slice(bodyStart, bodyEnd).toString("utf8");
      this.buffer = this.buffer.slice(bodyEnd);
      this.onMessage(JSON.parse(body));
    }
  }

  onMessage(message) {
    if (message.id === undefined) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(message.id);

    if (message.error) {
      pending.reject(new Error(message.error.message || JSON.stringify(message.error)));
    } else {
      pending.resolve(message.result);
    }
  }

  async close() {
    if (!this.child) return;
    const child = this.child;
    this.child = null;
    child.stdin.end();
    child.kill();
  }
}

export async function withMcp(callback, options = {}) {
  const server = await loadMcpServerConfig(options.server || "onprem-atlassian");
  const client = new McpClient(server, options);
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.close();
  }
}
