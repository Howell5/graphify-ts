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

### 3. Install the auto-update hook

```bash
graphify hook install
```

This writes a Stop hook to `~/.claude/settings.json`. After every Claude Code session, the graph is updated automatically based on `git diff`. The agent never needs to remember.

Verify with `graphify hook status`. Remove anytime with `graphify hook uninstall`.

## Using the Skill

In a Claude Code session:

```
/graphify build         — index the current project (first time only)
/graphify query <name>  — find symbols by name
```

You do **not** need to manually run `/graphify update` — the Stop hook handles it at the end of each session. Use `/graphify update <file>` only as a manual override (e.g., to force a mid-session sync).

## How Agents Should Use This

### The Navigation Pattern

1. **Before searching code:** Check the graph first. Instead of `grep -r "auth"`, the agent queries the graph for "auth" to get exact file locations.

2. **After editing code:** Nothing to do. The Stop hook auto-updates the graph when the session ends.

3. **When exploring unfamiliar code:** Use `callersOf` and `calleesOf` to trace execution paths. Use `shortestPath` to understand how distant modules connect.

## How Auto-Update Works

`graphify hook install` adds this entry to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "graphify auto-update \"${CLAUDE_PROJECT_DIR:-.}\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

When a Claude Code session ends, `graphify auto-update`:

1. Checks `graphify-out/graph.json` exists (skip if not)
2. Checks the dir is a git repo (skip if not)
3. Runs `git diff --name-only HEAD` + `git ls-files --others --exclude-standard` to find changed + new files
4. Filters to supported code file extensions
5. Calls `updateIndex` with the absolute paths

It's silent on no-op paths (no index, no git, no code changes) so your terminal stays clean. The installer is idempotent — run it repeatedly without duplicating hooks. Existing settings and hooks are preserved.

### Optional: Context Injection

Claude Code doesn't need this — the skill already tells the agent to query the graph first. But if you want an extra nudge before every Glob/Grep, add a PreToolUse hook manually:

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

Done.

[Session ends. Stop hook runs `graphify auto-update` automatically.
 Next session, graph reflects the fix.]
```

The agent navigated directly to the right files without grep-guessing, and never had to remember to update the index.
