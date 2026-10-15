#!/usr/bin/env node
// Copies this starter into ~/.claude WITHOUT overwriting anything that already exists.
// Works on macOS, Linux and Windows. Read it first. Run: node install.mjs
import { existsSync, mkdirSync, copyFileSync, readdirSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = dirname(fileURLToPath(import.meta.url));
const DEST = join(homedir(), ".claude");

function copy(rel, destRel = rel) {
  const to = join(DEST, destRel);
  mkdirSync(dirname(to), { recursive: true });
  if (existsSync(to)) { console.log(`skip   ${to} (exists)`); return; }
  copyFileSync(join(SRC, rel), to);
  if (to.endsWith(".mjs") && process.platform !== "win32") chmodSync(to, 0o755);
  console.log(`copied ${to}`);
}

copy("CLAUDE.md");
copy("hooks/typecheck.mjs");
copy("hooks/deploy-watch.mjs");
copy("statusline/statusline.mjs");
for (const a of readdirSync(join(SRC, "agents")).filter((f) => f.endsWith(".md"))) copy(`agents/${a}`);

const settings = join(DEST, "settings.json");
if (existsSync(settings)) {
  console.log(`skip   ${settings} (exists): merge settings.json from this folder by hand, or ask Claude:`);
  console.log(`       "merge ~/claude-starter/settings.json into ~/.claude/settings.json, keeping my existing keys"`);
} else {
  copyFileSync(join(SRC, "settings.json"), settings);
  console.log(`copied ${settings}`);
}
console.log("Done. Start a new Claude Code session, then run /agents, /hooks and claude doctor.");
