# claude-starter

Alex Znamenskiy's Claude Code configuration, sanitised, as a starting point. This is the starter used in the Bonus lessons of the **Sasha Builds AI Journey** (sashaba.com).

Everything that makes Claude Code yours is a text file under `~/.claude`. This repo is those files.

Works on **Mac, Linux and Windows**. The hooks, the status line and the installer are plain Node.js scripts (`.mjs`): no bash, no `jq`, nothing extra to install beyond Node, which the course already sets up.

## What is here

| File | What it does |
|---|---|
| `settings.json` | Model (opus), effort (medium), Manual permission mode, two hooks, the status line, notifications. Course edition: `defaultMode` is `default` — switch to `auto` once you know what Claude would have asked. |
| `CLAUDE.md` | The personal instructions template. Edit every line so it is true about you. Lands at `~/.claude/CLAUDE.md`. |
| `hooks/typecheck.mjs` | PostToolUse hook (after Edit / Write): finds the nearest `tsconfig.json` above the edited file — so it works even when Claude is started from your home folder — and runs the project's own TypeScript check there. Errors go back to Claude in the same turn (first 30 lines, on stderr with exit code 2). No `tsconfig.json`, no local TypeScript, or not a TS/JS file: does nothing. |
| `hooks/deploy-watch.mjs` | PostToolUse hook: after a `git push` or a Vercel deploy (Bash, PowerShell or the Vercel plugin), reminds Claude to confirm the deployment is live and check it in the browser before saying "done". |
| `statusline/statusline.mjs` | Status bar: model · folder · git branch (dirty / ahead / behind) · context bar (amber ≥ 55 %, red ≥ 80 %) · cost · elapsed · lines changed · time. |
| `agents/qa-tester.md` | Opens the live site in Chrome, runs the critical flows, reports a pass/fail table. |
| `agents/ux-reviewer.md` | Walks the site as a first-time user; scores clarity, friction, copy, mobile, trust. |
| `agents/design-reviewer.md` | Judges against the BAR section at the top of the file — edit it to your taste. |
| `install.mjs` | Copies each piece into `~/.claude` **only if it does not already exist**. Never overwrites. |

### What the reviewer agents can and can't do

Their tools are Read, Grep and Glob (read your code) plus Claude in Chrome (open and click through your site). They have no shell (Bash is disallowed), and their instructions say never to edit or write project files. One honest catch: they keep per-project memory (`memory: project`), and Claude Code switches on Read/Write/Edit for an agent with memory so it can save its notes in `.claude/agent-memory/`. So "only writes its own notes" is a rule in the instructions, not a lock. Want a hard lock? Delete the `memory: project` line; you lose the "still open" notes between runs.

## Install

Read before you copy — a hook is code that runs on your machine.

```bash
git clone https://github.com/dentaco/claude-starter.git ~/claude-starter
cd ~/claude-starter
cat install.mjs
node install.mjs
```

The same commands work in PowerShell on Windows (`~` is your user folder there too; use `Get-Content install.mjs` instead of `cat` if you like).

Then start a new Claude Code session and run `/agents`, `/hooks`, and `claude doctor`.

If you already have a `~/.claude/settings.json`, the installer leaves it alone. Merge by hand, or ask Claude:

> merge ~/claude-starter/settings.json into ~/.claude/settings.json, keeping my existing keys

The agents use the Claude in Chrome extension (`claude --chrome` once, then `/chrome` → Enabled by default). Without it they fall back to reading the code only.

### How the commands find the scripts (Mac and Windows)

`settings.json` runs each script as `node "$HOME/.claude/hooks/typecheck.mjs"`. Claude Code runs hook and status line commands through a shell: `sh` on Mac and Linux, Git Bash on Windows, or PowerShell on Windows when Git Bash isn't installed. All three expand `$HOME` to your user folder, and `node` accepts the path with forward slashes on Windows, so the same line works everywhere. (Don't use `~` or `%USERPROFILE%` here: PowerShell and Git Bash don't agree on them.)

### Upgrading from the old bash version

Earlier versions shipped `hooks/post-deploy-ship.sh`, `statusline/statusline.sh` and an inline `npx tsc` hook. If you installed those, ask Claude:

> replace my claude-starter hooks and status line with the .mjs versions from ~/claude-starter: update the commands in ~/.claude/settings.json to match the starter's settings.json, keep all my other settings, back up settings.json first, then delete ~/.claude/hooks/post-deploy-ship.sh and ~/.claude/statusline/statusline.sh

## Audit it first

Paste this into Claude Code from the cloned folder:

> Read every file. For each hook and agent, tell me in one line what it does and whether it runs commands on my machine, sends anything over the network, or reads files outside the project. Flag anything you would not install. Do not copy anything yet.

## Licence

MIT. Keep the notice; make it yours.
