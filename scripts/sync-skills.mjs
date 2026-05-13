import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
const workspaceRoot = resolve(packageRoot, "..", "..");
const sourceRoot = resolve(workspaceRoot, "plugins", "onprem-atlassian", "skills");
const targetRoot = resolve(packageRoot, "skills");

await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });
await cp(sourceRoot, targetRoot, { recursive: true });
console.log(`Synced skills from ${sourceRoot} to ${targetRoot}`);
console.log("Regenerate skills.manifest.json after syncing before publishing.");
