#!/usr/bin/env bash
# Claude Code status line — model · dir · git · context bar · cost · time
input=$(cat)
j() { printf '%s' "$input" | jq -r "$1" 2>/dev/null; }

model=$(j '.model.display_name // "Claude"')
cwd=$(j '.workspace.current_dir // .cwd // ""')
cost=$(j '.cost.total_cost_usd // 0')
dur_ms=$(j '.cost.total_duration_ms // 0')
pct=$(j '.context_window.used_percentage // empty')
ctx_size=$(j '.context_window.context_window_size // empty')
in_tok=$(j '.context_window.total_input_tokens // 0')
out_tok=$(j '.context_window.total_output_tokens // 0')
lines_add=$(j '.cost.total_lines_added // 0')
lines_del=$(j '.cost.total_lines_removed // 0')

# ---- colours (truecolor, falls back gracefully) ----
R=$'\e[0m'; B=$'\e[1m'; D=$'\e[2m'
C_MODEL=$'\e[38;2;214;160;255m'   # lilac
C_DIR=$'\e[38;2;120;200;255m'     # sky
C_GIT=$'\e[38;2;255;179;71m'      # amber
C_OK=$'\e[38;2;98;220;150m'       # mint
C_WARN=$'\e[38;2;255;204;92m'     # gold
C_BAD=$'\e[38;2;255;110;110m'     # coral
C_COST=$'\e[38;2;160;220;160m'
C_SEP=$'\e[38;2;90;90;110m'
SEP="${C_SEP} │ ${R}"

# ---- directory (~ shortened, last 2 segments) ----
short="${cwd/#$HOME/~}"
IFS='/' read -ra parts <<<"$short"
n=${#parts[@]}
if (( n > 3 )); then short="…/${parts[n-2]}/${parts[n-1]}"; fi

# ---- git ----
git_seg=""
if [ -n "$cwd" ] && git -C "$cwd" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  br=$(git -C "$cwd" symbolic-ref --short HEAD 2>/dev/null || git -C "$cwd" rev-parse --short HEAD 2>/dev/null)
  dirty=""
  if [ -n "$(git -C "$cwd" status --porcelain 2>/dev/null | head -1)" ]; then dirty="${C_WARN}✱${R}"; fi
  ahead=$(git -C "$cwd" rev-list --count @{u}..HEAD 2>/dev/null || echo 0)
  behind=$(git -C "$cwd" rev-list --count HEAD..@{u} 2>/dev/null || echo 0)
  ab=""
  (( ahead > 0 )) && ab+=" ${C_OK}↑${ahead}${R}"
  (( behind > 0 )) && ab+=" ${C_BAD}↓${behind}${R}"
  git_seg="${SEP}${C_GIT} ${br}${R}${dirty}${ab}"
fi

# ---- context bar ----
ctx_seg=""
if [ -n "$pct" ]; then
  p=${pct%.*}; (( p < 0 )) && p=0; (( p > 100 )) && p=100
  filled=$(( p / 10 )); empty=$(( 10 - filled ))
  if   (( p >= 80 )); then col=$C_BAD
  elif (( p >= 55 )); then col=$C_WARN
  else col=$C_OK; fi
  bar=""
  for ((i=0;i<filled;i++)); do bar+="█"; done
  for ((i=0;i<empty;i++));  do bar+="░"; done
  ctx_seg="${SEP}${col}${bar} ${p}%${R}"
  if [ -n "$ctx_size" ]; then
    if (( ctx_size >= 1000000 )); then ctx_seg+="${D} $(( ctx_size / 1000000 ))M${R}"
    else ctx_seg+="${D} $(( ctx_size / 1000 ))k${R}"; fi
  fi
fi

# ---- cost / duration ----
cost_fmt=$(printf '%.2f' "$cost")
secs=$(( dur_ms / 1000 )); mins=$(( secs / 60 )); hrs=$(( mins / 60 ))
if   (( hrs > 0 )); then dur="${hrs}h$(( mins % 60 ))m"
elif (( mins > 0 )); then dur="${mins}m"
else dur="${secs}s"; fi
cost_seg="${SEP}${C_COST}\$${cost_fmt}${R}${D} ${dur}${R}"

# ---- lines changed ----
diff_seg=""
if (( lines_add > 0 || lines_del > 0 )); then
  diff_seg="${SEP}${C_OK}+${lines_add}${R} ${C_BAD}-${lines_del}${R}"
fi

now=$(date +%H:%M)

printf '%s' "${C_MODEL}${B}◆ ${model}${R}${SEP}${C_DIR}${short}${R}${git_seg}${ctx_seg}${cost_seg}${diff_seg}${SEP}${D}${now}${R}"
