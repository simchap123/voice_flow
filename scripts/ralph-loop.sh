#!/usr/bin/env bash
#
# Ralph Wiggum Loop for VoxGen
# Iterates through specs in specs/ directory, implementing each one autonomously.
# Each iteration spawns a fresh Claude Code session with clean context.
#
# Usage:
#   ./scripts/ralph-loop.sh          # Run all specs
#   ./scripts/ralph-loop.sh 10       # Max 10 iterations
#

set -euo pipefail

MAX_ITERATIONS=${1:-20}
SPECS_DIR="specs"
HISTORY_FILE="ralph_history.txt"
LOGS_DIR="logs"

mkdir -p "$LOGS_DIR"

echo "=== Ralph Wiggum Loop ==="
echo "Max iterations: $MAX_ITERATIONS"
echo "Specs directory: $SPECS_DIR"
echo ""

iteration=0

while [ $iteration -lt $MAX_ITERATIONS ]; do
  iteration=$((iteration + 1))
  timestamp=$(date +%Y%m%d_%H%M%S)
  log_file="$LOGS_DIR/ralph_iter_${iteration}_${timestamp}.log"

  echo "--- Iteration $iteration ---"

  # Find the next unfinished spec
  next_spec=""
  for spec_file in "$SPECS_DIR"/*.md; do
    [ -f "$spec_file" ] || continue
    spec_name=$(basename "$spec_file")

    # Check if this spec was already completed
    if grep -q "COMPLETED: $spec_name" "$HISTORY_FILE" 2>/dev/null; then
      echo "  [DONE] $spec_name"
      continue
    fi

    next_spec="$spec_file"
    echo "  [NEXT] $spec_name"
    break
  done

  if [ -z "$next_spec" ]; then
    echo ""
    echo "=== All specs completed! ==="
    break
  fi

  spec_content=$(cat "$next_spec")
  spec_basename=$(basename "$next_spec")

  # Build the prompt for Claude Code
  prompt="You are Ralph Wiggum, an autonomous coding agent. Your job is to implement the following spec COMPLETELY.

## Current Spec: $spec_basename

$spec_content

## Instructions
1. Read all files mentioned in the spec before making changes
2. Implement all requirements
3. Run \`npm run build\` to verify the build passes
4. If the build fails, fix ALL errors before continuing
5. When ALL acceptance criteria are met, append this line to $HISTORY_FILE:
   COMPLETED: $spec_basename — $(date +%Y-%m-%d) — [brief summary of what was done]
6. Then output: <promise>DONE</promise>

## Project Context
- Stack: Electron 33 + React 19 + Vite 6 + TypeScript 5 + Tailwind 3 + shadcn/ui
- ESM project (\"type\": \"module\" in package.json)
- Path alias: @/ → src/
- IPC pattern: ipcMain.handle() + ipcRenderer.invoke()
- Toast system: import { toast } from '@/hooks/useToast'
- License API base: https://voxgenflow.vercel.app
- Build command: npm run build
- DO NOT run tsc standalone (vite handles TS compilation)

## Previous History
$(cat "$HISTORY_FILE")
"

  echo "  Spawning Claude Code for: $spec_basename"
  echo "  Log: $log_file"

  # Run Claude Code with the prompt
  # Using --print for non-interactive mode, piping to log
  if claude --print "$prompt" 2>&1 | tee "$log_file"; then
    # Check if the spec was completed
    if grep -q "COMPLETED: $spec_basename" "$HISTORY_FILE" 2>/dev/null; then
      echo "  [SUCCESS] $spec_basename completed!"
    else
      echo "  [RETRY] $spec_basename not yet complete, will retry next iteration"
    fi
  else
    echo "  [ERROR] Claude Code exited with error, will retry"
  fi

  echo ""
done

echo "=== Ralph Loop finished after $iteration iterations ==="
echo "History:"
cat "$HISTORY_FILE"
