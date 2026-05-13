import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
const manifestPath = resolve(packageRoot, "skills.manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const errors = [];

if (!Array.isArray(manifest.skills)) {
  errors.push("skills.manifest.json must contain a skills array.");
}

if (manifest.skillCount !== manifest.skills.length) {
  errors.push(`Manifest skillCount ${manifest.skillCount} does not match ${manifest.skills.length}.`);
}

for (const skill of manifest.skills || []) {
  const path = resolve(packageRoot, skill.path);
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch {
    errors.push(`Missing skill file: ${skill.path}`);
    continue;
  }

  const hash = createHash("sha256").update(text).digest("hex");
  if (hash !== skill.sha256) {
    errors.push(`Hash mismatch: ${skill.path}`);
  }

  const nameMatch = /^name:\s*(.+)$/m.exec(text);
  if (!nameMatch || nameMatch[1].trim() !== skill.name) {
    errors.push(`Frontmatter name mismatch: ${skill.path}`);
  }
}

if (manifest.skillCount !== 15) {
  errors.push(`Expected 15 ported skills, found ${manifest.skillCount}.`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Skill manifest OK: ${manifest.skillCount} skills.`);
