# Getting Started

## Install

```bash
npm i -g graphify-ts
```

Requires [Bun](https://bun.sh) runtime.

## Install the Skill (optional)

The skill teaches your AI agent how to use the CLI automatically:

```bash
npx skills add Howell5/willhong-skills -s graphify
```

Without the skill, you (or your agent) can still use the CLI directly.

## Enable Auto-Update (recommended)

```bash
graphify hook install
```

This installs a Claude Code Stop hook. After every session, the graph updates automatically based on `git diff` — you never need to manually re-index after editing. Run `graphify hook uninstall` to remove.

## Build Your First Index

```bash
cd your-project
graphify build .
```

Output:
```
Scanning /path/to/your-project...
Indexed 42 files, 187 symbols, 214 relationships
Saved to /path/to/your-project/graphify-out/graph.json
```

## Query the Index

```bash
graphify query graphify-out/graph.json UserService
```

Output:
```
UserService → src/services/user.ts:12
.getUser → src/services/user.ts:15
.deleteUser → src/services/user.ts:28
```

## Updating After Edits

If you installed the Stop hook (`graphify hook install`), **you don't need to do anything** — the graph updates automatically at the end of each Claude Code session.

For manual updates (no hook, or mid-session force sync):

```bash
graphify update graphify-out/graph.json src/services/user.ts
```

Output:
```
Updated: +2 nodes, -1 nodes, 1 files re-extracted
```

## What Gets Extracted

For each source file, graphify extracts:

| Entity | Example | Node Label |
|--------|---------|------------|
| File | `auth.py` | `auth.py` |
| Class | `class UserService` | `UserService` |
| Function | `def login()` | `login` |
| Method | `def validate(self)` inside a class | `.validate` |
| Arrow Function (JS/TS) | `const fetch = () => {}` | `fetch` |

And these relationships:

| Relationship | Meaning |
|-------------|---------|
| File → Class | "this file contains this class" |
| File → Function | "this file contains this function" |
| Class → Method | "this class has this method" |
| File → Module | "this file imports this module" |
| Class → Class | "this class inherits from that class" |
| Function → Function | "this function calls that function" (INFERRED) |

## With an AI Agent

Once the skill is installed, your agent can use slash commands:

```
/graphify build         — index the current project (first time only)
/graphify query auth    — find auth-related symbols
```

With the Stop hook installed (`graphify hook install`), the agent never needs to manually update the index — it just navigates by querying, and the graph stays current automatically.

## Next Steps

- [Advanced Usage](./advanced-usage.md) — graph queries, semantic labeling, diff
- [Claude Code Integration](./claude-code-integration.md) — hooks and auto-update
- [Adding Languages](./adding-languages.md) — extending with new language support
