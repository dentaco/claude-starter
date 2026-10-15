#!/usr/bin/env node
// PostToolUse hook (Edit|Write): typecheck the TypeScript project that owns the edited file.
//
// - Finds the nearest tsconfig.json by walking UP from the edited file's folder, so it works
//   even when Claude was started from your home folder instead of the project root.
// - No tsconfig.json, not a TS/JS file, or no local TypeScript install -> exits 0, silently.
// - Type errors -> first 30 lines on stderr + exit code 2. That is how a PostToolUse hook
//   feeds text back to Claude (plain stdout / exit 0 output never reaches it).
// - Plain Node, no shell, no jq: works the same on macOS, Linux and Windows.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, extname, parse } from "node:path";
import { spawnSync } from "node:child_process";

const MAX_LINES = 30;
const CHECKED = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);

function quietExit() { process.exit(0); }

let input;
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { quietExit(); }

const ti = input?.tool_input ?? {};
const raw = ti.file_path ?? ti.path;
if (!raw || typeof raw !== "string") quietExit();

const file = resolve(input.cwd || process.cwd(), raw);
if (!CHECKED.has(extname(file).toLowerCase())) quietExit();
if (/[\\/]node_modules[\\/]/.test(file)) quietExit();

// Walk up from the edited file's folder to the filesystem root.
function findUp(start, name) {
  let dir = start;
  const { root } = parse(dir);
  while (true) {
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
    if (dir === root) return null;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

const tsconfig = findUp(dirname(file), "tsconfig.json");
if (!tsconfig) quietExit();
const projectDir = dirname(tsconfig);

// Use the project's own TypeScript (never `npx tsc`: without a local install npx would
// try to download an unrelated package called "tsc").
const tscJs = findUp(projectDir, join("node_modules", "typescript", "bin", "tsc"));
if (!tscJs) quietExit();

const run = spawnSync(process.execPath, [tscJs, "--noEmit", "--pretty", "false", "-p", tsconfig], {
  cwd: projectDir,
  encoding: "utf8",
  timeout: 110_000,
  maxBuffer: 32 * 1024 * 1024,
  windowsHide: true,
});

if (run.error || run.status === null) quietExit(); // timed out or could not start: don't block Claude
if (run.status === 0) quietExit();

const lines = `${run.stdout || ""}${run.stderr || ""}`.split(/\r?\n/).filter((l) => l.trim());
if (lines.length === 0) quietExit();
const errorCount = lines.filter((l) => /error TS\d+/.test(l)).length;
const shown = lines.slice(0, MAX_LINES);
const more = lines.length > MAX_LINES ? `\n... ${lines.length - MAX_LINES} more lines not shown.` : "";

process.stderr.write(
  `TypeScript check failed in ${projectDir} (${errorCount || "some"} error${errorCount === 1 ? "" : "s"}). Fix these before moving on:\n` +
    shown.join("\n") + more + "\n"
);
process.exit(2);
