English | [简体中文](./README.zh-CN.md)

# graphify-ts

A code navigation layer for AI coding agents. Not a library for humans to install — a skill that gives agents structural awareness of any codebase.

Built on tree-sitter WASM (12 languages) + graphology. Runs inside Claude Code as a skill.

## What It Does

When an AI agent lands in an unfamiliar codebase, it guesses which files to read. It greps for keywords. It opens wrong files. It wastes tokens.

graphify-ts gives the agent a structural map:
- **What symbols exist** — classes, functions, imports across 12 languages
- **Where they live** — file + line number
- **How they connect** — call graph, inheritance, import relationships
- **What they mean** — optional semantic labels (the agent itself provides these)

The agent queries the map instead of searching blind. After editing code, it updates the map to keep it in sync.

## How It Works

```
Agent starts session
  → /graphify build
  → graphify-out/graph.json created (AST index of entire codebase)

Agent needs to find auth code
  → /graphify query auth
  → returns: auth::login (src/auth.ts:15), auth::middleware (src/middleware.ts:8)
  → agent reads the right files directly

Agent edits src/auth.ts
  → /graphify update src/auth.ts
  → graph updated incrementally (only re-extracts changed file)
```

No API keys. No external services. The agent IS the runtime.

## Installation

### 1. Install the CLI

```bash
npm i -g graphify-ts
```

Requires [Bun](https://bun.sh) runtime.

### 2. Install the skill (tells your agent how to use the CLI)

```bash
# Claude Code, Cursor, Cline, Copilot — pick your agent
npx skills add Howell5/willhong-skills -s graphify

# Or all agents at once
npx skills add Howell5/willhong-skills -s graphify -a '*'
```

That's it. The agent now knows `/graphify build`, `/graphify query`, `/graphify update`.

## CLI

```bash
graphify build [dir]                    # Index a directory (default: .)
graphify query <graph.json> <name>      # Search symbols by name
graphify update <graph.json> <files...> # Re-index changed files
graphify help                           # Show help
```

## Supported Languages

Python, JavaScript, TypeScript (JSX/TSX), Go, Rust, Java, C, C++, Ruby, C#, Kotlin, Scala, PHP

All via tree-sitter WASM — deterministic AST extraction, no LLM needed for structure.

## Graph Schema

```json
{
  "nodes": [{
    "id": "main::app",
    "label": "App",
    "fileType": "code",
    "sourceFile": "main.py",
    "sourceLocation": "main.py:5"
  }],
  "edges": [{
    "source": "file::main",
    "target": "main::app",
    "relation": "contains",
    "confidence": "EXTRACTED"
  }],
  "metadata": { "files": 10, "nodes": 45, "edges": 62 }
}
```

### Edge Relations

| Relation | Confidence | Meaning |
|----------|-----------|---------|
| `contains` | EXTRACTED | File contains a class/function |
| `method` | EXTRACTED | Class contains a method |
| `imports` | EXTRACTED | File imports a module |
| `imports_from` | EXTRACTED | File imports names from a module |
| `inherits` | EXTRACTED | Class inherits from another |
| `calls` | INFERRED | Function calls another function |

## Capabilities

The skill exposes these to the agent:

| Function | Purpose |
|----------|---------|
| `buildIndex(dir)` | Full AST scan → graph.json |
| `query(graphPath, name)` | Symbol search (case-insensitive) |
| `updateIndex(graphPath, files)` | Incremental re-extraction |
| `findSymbol(graph, name)` | Find nodes by label |
| `callersOf(graph, nodeId)` | Who calls this function? |
| `calleesOf(graph, nodeId)` | What does this function call? |
| `fileSymbols(graph, file)` | All symbols in a file |
| `shortestPath(graph, a, b)` | How are two symbols connected? |
| `graphDiff(old, new)` | What changed between snapshots? |
| `labelNodes(graph, labeler)` | Assign semantic domain labels |

## Architecture

```
src/
├── index.ts          # Public API: buildIndex, query, updateIndex
├── detect.ts         # File discovery + classification
├── cache.ts          # SHA256 incremental cache
├── extract.ts        # Generic tree-sitter AST extraction engine
├── languages/        # Per-language LanguageConfig (12 languages)
├── graph.ts          # graphology graph build/merge/serialize
├── query.ts          # Symbol search, callers, callees, shortest path
├── diff.ts           # Graph snapshot comparison
└── semantic.ts       # Pluggable semantic labeling interface
```

**Dependencies:** `web-tree-sitter` (0.24.7), `tree-sitter-wasms`, `graphology`

## Docs

- [Getting Started](./docs/getting-started.md) | [快速入门](./docs/getting-started.zh-CN.md)
- [Advanced Usage](./docs/advanced-usage.md) | [高级用法](./docs/advanced-usage.zh-CN.md)
- [Claude Code Integration](./docs/claude-code-integration.md) | [Claude Code 集成](./docs/claude-code-integration.zh-CN.md)
- [Adding Languages](./docs/adding-languages.md) | [添加语言支持](./docs/adding-languages.zh-CN.md)

## Development

```bash
bun install && bun test   # 70 tests, 12 languages
```

## License

MIT
