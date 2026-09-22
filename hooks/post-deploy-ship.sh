#!/usr/bin/env bash
input="$(cat)"
tool_name="$(echo "$input" | jq -r '.tool_name // empty')"
command="$(echo "$input" | jq -r '.tool_input.command // empty')"

is_deploy=false
if [ "$tool_name" = "mcp__plugin_vercel_vercel__deploy_to_vercel" ]; then
  is_deploy=true
elif [ "$tool_name" = "Bash" ]; then
  # Split the command into segments on && ; || | and newlines, then require a
  # segment whose first program (after optional env assignments / npx / bunx)
  # is the vercel CLI, invoked with `deploy` or `--prod`.
  while IFS= read -r seg; do
    seg="$(echo "$seg" | sed -E 's/^[[:space:]]+//')"
    if echo "$seg" | grep -qE '^([A-Za-z_][A-Za-z0-9_]*=[^ ]* +)*((npx|bunx|pnpm dlx) +)?vercel([[:space:]]|$)' \
      && echo "$seg" | grep -qE '(^|[[:space:]])(deploy|--prod)([[:space:]]|$)'; then
      is_deploy=true
      break
    fi
  done < <(echo "$command" | sed -E 's/(&&|\|\||;|\|)/\n/g')
fi

if [ "$is_deploy" = true ]; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"A Vercel deploy just ran. Follow the ship skill: confirm the deployment is actually live (don't assume the command succeeding means it published), and if this deploy skipped typecheck, build, or live browser verification, run the /ship skill to cover those steps too."}}
JSON
fi
