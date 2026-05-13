import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const skillsDir = resolve(packageRoot, "skills");
export const mcpConfigPath = resolve(packageRoot, ".mcp.json");
