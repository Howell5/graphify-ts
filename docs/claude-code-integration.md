# Claude Code Integration

graphify-ts is designed as a navigation layer for AI agents. It ships as a Claude Code skill that agents can invoke during coding sessions.

## Installing the Skill

Copy `skill.md` to your Claude Code skills directory:

```bash
mkdir -p ~/.claude/skills/graphify-ts
cp skill.md ~/.claude/skills/graphify-ts/SKILL.md
```

Or reference it in your project's `.claude/settings.json`.

## Using the Skill

### Build an index

In a Claude Code session:

```
/graphify build
```

This scans the current directory and produces `graphify-out/graph.json`.

### Query the index

```
/graphify query AuthService
```

Returns matching symbols with file locations, so the agent knows where to look.

### Update after edits

```
/graphify update src/auth.ts src/models/user.ts
```

Re-extracts only the changed files and merges back into the graph.

### Semantic labeling

```
/graphify label
```

Uses Claude to assign domain labels (e.g. "authentication", "database") to symbols.

## How Agents Should Use This

### The Navigation Pattern

1. **Before searching code:** Check the graph first. Instead of `grep -r "auth"`, query the graph for "auth" to get exact file locations and understand the module structure.

2. **After editing code:** Update the graph so future queries reflect the current state. This is the "agent maintains its own map" pattern.

3. **When exploring unfamiliar code:** Use `callersOf` and `calleesOf` to trace execution paths. Use `shortestPath` to understand how distant modules connect.

### Auto-Update Hook

For fully autonomous operation, set up a PostToolUse hook that runs `updateIndex` after every Edit or Write:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "if [ -f graphify-out/graph.json ]; then bun run graphify-ts/src/index.ts update graphify-out/graph.json $CHANGED_FILE; fi"
      }
    ]
  }
}
```

This keeps the navigation layer in sync without manual intervention.

### Context Injection

Set up a PreToolUse hook to inject graph context before Glob/Grep:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Glob|Grep",
        "command": "if [ -f graphify-out/graph.json ]; then echo 'Knowledge graph available. Check graphify-out/graph.json for symbol locations before searching.'; fi"
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
[reads src/auth.ts, finds the bug]
[fixes the bug]

Now let me update the graph.
/graphify update src/auth.ts

Graph updated: 0 new nodes, 0 removed, 1 file re-extracted.
```

The agent navigated directly to the right files without grep-guessing.
