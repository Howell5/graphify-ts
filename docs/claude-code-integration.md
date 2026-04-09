# Claude Code Integration

graphify-ts is designed as a navigation layer for AI coding agents. The skill tells the agent how to use the `graphify` CLI.

## Setup

### 1. Install the CLI

```bash
npm i -g graphify-ts
```

### 2. Install the skill

```bash
npx skills add Howell5/willhong-skills -s graphify
```

The skill lives in [Howell5/willhong-skills](https://github.com/Howell5/willhong-skills), not in this repo. It's a pure prompt (SKILL.md) that teaches the agent how to invoke the CLI.

## Using the Skill

In a Claude Code session:

```
/graphify build         — index the current project
/graphify query <name>  — find symbols by name
/graphify update <file> — re-index after editing
```

## How Agents Should Use This

### The Navigation Pattern

1. **Before searching code:** Check the graph first. Instead of `grep -r "auth"`, the agent queries the graph for "auth" to get exact file locations.

2. **After editing code:** Update the graph so future queries reflect the current state.

3. **When exploring unfamiliar code:** Use `callersOf` and `calleesOf` to trace execution paths. Use `shortestPath` to understand how distant modules connect.

## Auto-Update Hook

For fully autonomous operation, set up a PostToolUse hook that updates the graph after every Edit or Write:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "[ -f graphify-out/graph.json ] && graphify update graphify-out/graph.json $CHANGED_FILE || true"
      }
    ]
  }
}
```

### Context Injection

Set up a PreToolUse hook to remind the agent about the graph before searching:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Glob|Grep",
        "command": "[ -f graphify-out/graph.json ] && echo 'graphify index available — run /graphify query before searching blind' || true"
      }
    ]
  }
}
```

## Example Workflow

```
Human: Find and fix the authentication bug in this project.

Agent: Let me check the code navigation graph first.
/graphify query auth

Found:
- auth::login (src/auth.ts:15)
- auth::verify_token (src/auth.ts:42)
- auth::middleware (src/middleware.ts:8)

Let me read the relevant files...
[reads src/auth.ts, finds the bug, fixes it]

Now let me update the graph.
/graphify update src/auth.ts

Updated: +0 nodes, -0 nodes, 1 file re-extracted.
```

The agent navigated directly to the right files without grep-guessing.
