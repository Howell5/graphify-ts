---
name: graphify
description: "Use when exploring unfamiliar codebases, before searching for code, or after editing files. Builds a structural AST index (classes, functions, imports, call graph) from 12 languages via tree-sitter. Trigger: /graphify"
allowed-tools: Bash(graphify:*), Bash(npx graphify-ts:*)
---

> **Note:** This is a reference copy. The production skill is at [Howell5/willhong-skills](https://github.com/Howell5/willhong-skills/tree/main/skills/graphify).

# graphify — Code Navigation Layer

Structural index of the codebase. Know what exists, where, and how it connects — before you grep.

Requires CLI: `npm i -g graphify-ts`

## Commands

### `/graphify` or `/graphify build`

```bash
graphify build .
```

Scans all source files, extracts AST structure, saves to `graphify-out/graph.json`.

Report: "Indexed {files} files, {nodes} symbols, {edges} relationships"

### `/graphify query <name>`

```bash
graphify query graphify-out/graph.json <name>
```

Search for symbols by name. Returns matching symbols with file locations.

### `/graphify update <files...>`

```bash
graphify update graphify-out/graph.json <file1> [file2...]
```

Re-extract only the changed files and merge back. Report the diff.

## When to Use

**Before searching code:** If `graphify-out/graph.json` exists, query it before Glob or Grep.

**After editing code:** Run `/graphify update <changed-files>` to keep the index current.

**Exploring unfamiliar code:** Run `/graphify query <concept>` to find entry points.

## Supported Languages

Python, JavaScript, TypeScript (JSX/TSX), Go, Rust, Java, C, C++, Ruby, C#, Kotlin, Scala, PHP

## Graph Output

```json
{
  "nodes": [{ "id": "main::app", "label": "App", "sourceFile": "main.py", "sourceLocation": "main.py:5" }],
  "edges": [{ "source": "file::main", "target": "main::app", "relation": "contains", "confidence": "EXTRACTED" }],
  "metadata": { "files": 10, "nodes": 45, "edges": 62 }
}
```

Edge relations: `contains`, `method`, `imports`, `imports_from`, `calls` (INFERRED), `inherits`
