import { spawn } from "node:child_process";

export function parseFlags(argv) {
  const out = { _: [] };
  const setFlag = (key, value) => {
    if (out[key] === undefined) {
      out[key] = value;
    } else if (Array.isArray(out[key])) {
      out[key].push(value);
    } else {
      out[key] = [out[key], value];
    }
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }

    const eq = token.indexOf("=");
    if (eq >= 0) {
      setFlag(token.slice(2, eq), token.slice(eq + 1));
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      setFlag(key, next);
      index += 1;
    } else {
      setFlag(key, true);
    }
  }
  return out;
}

export function asArray(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function truncateText(value, max = 12000) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n...[truncated ${text.length - max} chars]`;
}

export function commandExists(command, args = ["--version"], timeoutMs = 5000) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "ignore", shell: false });
    const timer = setTimeout(() => {
      child.kill();
      resolve(false);
    }, timeoutMs);

    child.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

export function printTable(rows, columns) {
  const widths = columns.map((column) => {
    const values = rows.map((row) => String(row[column.key] ?? ""));
    return Math.max(column.label.length, ...values.map((value) => value.length));
  });
  const render = (cells) => cells.map((cell, i) => String(cell).padEnd(widths[i])).join("  ");
  console.log(render(columns.map((column) => column.label)));
  console.log(render(widths.map((width) => "-".repeat(width))));
  for (const row of rows) {
    console.log(render(columns.map((column) => row[column.key] ?? "")));
  }
}
