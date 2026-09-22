# claude-starter

Alex Znamenskiy's Claude Code configuration, sanitised, as a starting point. This is the repo cloned in Module 2 of **Build & Ship with AI** (dentaco.ae).

Everything that makes Claude Code yours is a text file under `~/.claude`. This repo is those files.

## What is here

| File | What it does |
|---|---|
| `settings.json` | Model, effort, Manual permission mode, two hooks, the status line, notifications. Course edition: `defaultMode` is `default` — switch to `auto` after two weeks. |
| `CLAUDE.md` | The personal instructions template. Edit every line so it is true about you. Lands at `~/.claude/CLAUDE.md`. |
| `hooks/post-deploy-ship.sh` | PostToolUse hook: after any Vercel deploy, reminds Claude to confirm the deployment is live and verify in the browser instead of reporting "done". Needs `jq`. |
| `statusline/statusline.sh` | Status bar: model · folder · git branch (dirty / ahead / behind) · context bar (amber ≥ 55 %, red ≥ 80 %) · cost · elapsed · lines changed · time. Needs `jq`. |
| `agents/qa-tester.md` | Opens the live site in Chrome, runs the critical flows, reports a pass/fail table. Read-only. |
| `agents/ux-reviewer.md` | Walks the site as a first-time user; scores clarity, friction, copy, mobile, trust. Read-only. |
| `agents/design-reviewer.md` | Judges against the BAR section at the top of the file — edit it to your taste. Read-only. |
| `install.sh` | Copies each piece into `~/.claude` **only if it does not already exist**. Never overwrites. |

The typecheck hook is inline in `settings.json`: after every edit, if the folder has a `tsconfig.json`, run `npx tsc --noEmit` so Claude sees type errors in the same turn.

## Install

Read before you copy — a hook is code that runs on your machine.

```bash
git clone https://github.com/dentaco/claude-starter.git ~/claude-starter
cd ~/claude-starter
cat install.sh
brew install jq          # once; the hook and status line need it
bash install.sh
```

Then start a new Claude Code session and run `/agents`, `/hooks`, and `claude doctor`.

If you already have a `~/.claude/settings.json`, the installer leaves it alone. Merge by hand, or ask Claude:

> merge ~/claude-starter/settings.json into ~/.claude/settings.json, keeping my existing keys

The agents use the Claude in Chrome extension (`claude --chrome` once, then `/chrome` → Enabled by default). Without it they fall back to reading the code only.

## Audit it first

Paste this into Claude Code from the cloned folder:

> Read every file. For each hook and skill, tell me in one line what it does and whether it runs commands on my machine, sends anything over the network, or reads files outside the project. Flag anything you would not install. Do not copy anything yet.

## Licence

MIT. Keep the notice; make it yours.
