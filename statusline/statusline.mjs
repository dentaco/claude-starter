#!/usr/bin/env node
// Claude Code status line: model · folder · git · context bar · cost · time · lines changed.
// Plain Node (no jq, no bash): works the same on macOS, Linux and Windows.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

let d = {};
try { d = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch {}

const model = d.model?.display_name || "Claude";
const cwd = d.workspace?.current_dir || d.cwd || "";
const cost = Number(d.cost?.total_cost_usd) || 0;
const durMs = Number(d.cost?.total_duration_ms) || 0;
const pct = d.context_window?.used_percentage;
const ctxSize = Number(d.context_window?.context_window_size) || 0;
const linesAdd = Number(d.cost?.total_lines_added) || 0;
const linesDel = Number(d.cost?.total_lines_removed) || 0;

// ---- colours (truecolor) ----
const E = "\x1b[";
const R = `${E}0m`, B = `${E}1m`, D = `${E}2m`;
const rgb = (r, g, b) => `${E}38;2;${r};${g};${b}m`;
const C_MODEL = rgb(214, 160, 255), C_DIR = rgb(120, 200, 255), C_GIT = rgb(255, 179, 71);
const C_OK = rgb(98, 220, 150), C_WARN = rgb(255, 204, 92), C_BAD = rgb(255, 110, 110);
const C_COST = rgb(160, 220, 160), C_SEP = rgb(90, 90, 110);
const SEP = `${C_SEP} │ ${R}`;

// ---- directory (~ shortened, last 2 segments) ----
let short = cwd;
const home = homedir();
if (home && short.toLowerCase().startsWith(home.toLowerCase())) short = "~" + short.slice(home.length);
const parts = short.split(/[\\/]/).filter(Boolean);
if (parts.length > 3) short = `…/${parts.at(-2)}/${parts.at(-1)}`;

// ---- git ----
function git(...args) {
  const r = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8", windowsHide: true, timeout: 2000 });
  return r.status === 0 ? r.stdout.trim() : null;
}
let gitSeg = "";
if (cwd && git("rev-parse", "--is-inside-work-tree") === "true") {
  const br = git("symbolic-ref", "--short", "HEAD") || git("rev-parse", "--short", "HEAD") || "";
  const dirty = git("status", "--porcelain") ? `${C_WARN}✱${R}` : "";
  const ahead = Number(git("rev-list", "--count", "@{u}..HEAD")) || 0;
  const behind = Number(git("rev-list", "--count", "HEAD..@{u}")) || 0;
  let ab = "";
  if (ahead > 0) ab += ` ${C_OK}↑${ahead}${R}`;
  if (behind > 0) ab += ` ${C_BAD}↓${behind}${R}`;
  gitSeg = `${SEP}${C_GIT} ${br}${R}${dirty}${ab}`;
}

// ---- context bar (amber >= 55 %, red >= 80 %) ----
let ctxSeg = "";
if (pct !== undefined && pct !== null && pct !== "") {
  const p = Math.max(0, Math.min(100, Math.trunc(Number(pct) || 0)));
  const filled = Math.floor(p / 10);
  const col = p >= 80 ? C_BAD : p >= 55 ? C_WARN : C_OK;
  ctxSeg = `${SEP}${col}${"█".repeat(filled)}${"░".repeat(10 - filled)} ${p}%${R}`;
  if (ctxSize) ctxSeg += `${D} ${ctxSize >= 1_000_000 ? `${Math.floor(ctxSize / 1_000_000)}M` : `${Math.floor(ctxSize / 1000)}k`}${R}`;
}

// ---- cost / duration ----
const secs = Math.floor(durMs / 1000), mins = Math.floor(secs / 60), hrs = Math.floor(mins / 60);
const dur = hrs > 0 ? `${hrs}h${mins % 60}m` : mins > 0 ? `${mins}m` : `${secs}s`;
const costSeg = `${SEP}${C_COST}$${cost.toFixed(2)}${R}${D} ${dur}${R}`;

// ---- lines changed ----
const diffSeg = linesAdd > 0 || linesDel > 0 ? `${SEP}${C_OK}+${linesAdd}${R} ${C_BAD}-${linesDel}${R}` : "";

const now = new Date().toTimeString().slice(0, 5);
process.stdout.write(`${C_MODEL}${B}◆ ${model}${R}${SEP}${C_DIR}${short}${R}${gitSeg}${ctxSeg}${costSeg}${diffSeg}${SEP}${D}${now}${R}`);
