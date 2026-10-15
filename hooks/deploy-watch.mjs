#!/usr/bin/env node
// PostToolUse hook (Bash|PowerShell|Vercel MCP deploy): after a deploy or a git push,
// remind Claude to confirm the deployment is live and check it in the browser before
// saying "done". The reminder goes back to Claude as additionalContext (JSON on stdout).
// Plain Node, no shell, no jq: works the same on macOS, Linux and Windows.
import { readFileSync } from "node:fs";

let input;
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { process.exit(0); }

const tool = input?.tool_name ?? "";
const command = String(input?.tool_input?.command ?? "");

// git options that take a separate value: git -C <dir> push, git -c k=v push, ...
const GIT_OPTS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"]);

function tokens(segment) {
  return (segment.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((t) => t.replace(/^["']|["']$/g, ""));
}

// Drop leading env assignments (FOO=bar), `sudo`, `npx`/`bunx`/`pnpm dlx`, and a leading `&` (PowerShell call operator).
function program(tok) {
  let i = 0;
  while (i < tok.length) {
    const t = tok[i];
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t) || t === "&" || t === "sudo" || t === "npx" || t === "bunx") { i++; continue; }
    if (t === "pnpm" && tok[i + 1] === "dlx") { i += 2; continue; }
    break;
  }
  return tok.slice(i);
}

function isGitPush(tok) {
  if (!/^git(\.exe)?$/i.test(tok[0] ?? "")) return false;
  let i = 1;
  while (i < tok.length && tok[i].startsWith("-")) {
    i += GIT_OPTS_WITH_VALUE.has(tok[i]) ? 2 : 1;
  }
  if (tok[i] !== "push") return false;
  const rest = tok.slice(i + 1);
  return !rest.includes("--dry-run") && !rest.includes("-n");
}

function isVercelDeploy(tok) {
  if (!/^vercel(\.cmd|\.exe)?$/i.test(tok[0] ?? "")) return false;
  const rest = tok.slice(1);
  // `vercel` alone deploys; so do `vercel deploy`, `vercel --prod`.
  if (rest.some((t) => ["--help", "-h", "--version", "-v"].includes(t))) return false;
  return rest.includes("deploy") || rest.includes("--prod") || rest.every((t) => t.startsWith("-"));
}

let kind = null;
if (/^mcp__.*vercel.*__deploy/i.test(tool)) {
  kind = "Vercel deploy";
} else if (tool === "Bash" || tool === "PowerShell") {
  for (const seg of command.split(/&&|\|\||;|\||\r?\n/)) {
    const tok = program(tokens(seg.trim()));
    if (isGitPush(tok)) { kind = "git push"; break; }
    if (isVercelDeploy(tok)) { kind = "Vercel deploy"; break; }
  }
}

if (!kind) process.exit(0);

const reminder =
  `A ${kind} just ran. The command finishing does not mean the site is live. ` +
  "Before you say done: confirm the new deployment actually finished and is live " +
  "(e.g. `vercel ls` / the Vercel dashboard, or the host's deploy status after a push), " +
  "open the live URL in Chrome, check the main flow works, and report what you saw. " +
  "If the push or deploy did not trigger a new deployment, say so instead of claiming it is live.";

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: reminder },
}));
process.exit(0);
