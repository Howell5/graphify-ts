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

## Update After Edits

After editing files, re-index only the changed ones:

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
/graphify build         — index the current project
/graphify query auth    — find auth-related symbols
/graphify update file   — re-index after editing
```

The agent navigates by structure instead of grep-guessing.

## Next Steps

- [Advanced Usage](./advanced-usage.md) — graph queries, semantic labeling, diff
- [Claude Code Integration](./claude-code-integration.md) — hooks and auto-update
- [Adding Languages](./adding-languages.md) — extending with new language support
