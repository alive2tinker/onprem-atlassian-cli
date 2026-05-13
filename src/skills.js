import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { skillsDir } from "./paths.js";

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return { meta: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end < 0) return { meta: {}, body: text };

  const raw = text.slice(4, end).trim();
  const meta = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (match) meta[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return { meta, body: text.slice(end + 4).trim() };
}

export async function loadSkills(root = skillsDir) {
  const entries = await readdir(root, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = join(root, entry.name, "SKILL.md");
    try {
      const info = await stat(file);
      if (!info.isFile()) continue;
      const text = await readFile(file, "utf8");
      const { meta, body } = parseFrontmatter(text);
      skills.push({
        dirName: entry.name,
        name: meta.name || entry.name,
        description: meta.description || "",
        body,
        text,
        path: file
      });
    } catch {
      // Ignore directories that are not skill folders.
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export function filterSkills(skills, namesOrTerms = []) {
  if (!namesOrTerms.length) return skills;
  const terms = namesOrTerms.map((term) => term.toLowerCase());
  return skills.filter((skill) => {
    const haystack = `${skill.name}\n${skill.description}\n${skill.body}`.toLowerCase();
    return terms.some((term) => skill.name.toLowerCase() === term || haystack.includes(term));
  });
}

export function skillsPrompt(skills) {
  return skills.map((skill) => {
    return `## ${skill.name}\nDescription: ${skill.description}\n\n${skill.body}`;
  }).join("\n\n---\n\n");
}
