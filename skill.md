---
name: graphify
description: "Use when exploring unfamiliar codebases, before searching for code, or after editing files. Builds a structural AST index (classes, functions, imports, call graph) from 12 languages via tree-sitter. Trigger: /graphify"
allowed-tools: Bash(graphify:*)
---

> **Note:** This is a reference copy. The production skill is at [Howell5/willhong-skills](https://github.com/Howell5/willhong-skills/tree/main/skills/graphify).

# graphify — Code Navigation Layer

Structural index of the codebase. Know what exists, where, and how it connects — before you grep.

**Requires CLI:** `npm i -g graphify-ts`

**Auto-update recommended:** Run `graphify hook install` once. After that, the graph updates automatically at the end of every Claude Code session via a Stop hook.

## First-time setup

```bash
npm i -g graphify-ts    # install CLI
graphify hook install   # install Stop hook for auto-update
```

Then per project:

```bash
graphify build .
```

## Commands

### `/graphify build` — Build index (first time only)

```bash
graphify build .
```

### `/graphify query <name>` — Search for symbols

```bash
graphify query graphify-out/graph.json <name>
```

### `/graphify update <files...>` — Manual incremental update

Usually not needed — the Stop hook handles updates automatically.

### `/graphify hook install | uninstall | status`

Manage the Claude Code Stop hook. Writes to `~/.claude/settings.json`.

## When to Use

**Before searching code:** Query the graph before Glob or Grep.

**You do NOT need to manually update after editing.** The Stop hook handles it.

## Supported Languages

Python, JavaScript, TypeScript (JSX/TSX), Go, Rust, Java, C, C++, Ruby, C#, Kotlin, Scala, PHP
