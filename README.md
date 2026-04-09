English | [简体中文](./README.zh-CN.md)

# graphify-ts

A code navigation layer for AI agents. Extracts AST structure from 12 programming languages via tree-sitter WASM, builds a queryable knowledge graph, and keeps it in sync as code changes.

**Not a visualization tool.** This is an always-on structural index that helps agents navigate codebases by understanding what exists, where, and how it connects — before they grep.

## Why

When an AI agent lands in an unfamiliar codebase, it guesses which files to read. It greps for keywords. It opens wrong files. It wastes tokens.

graphify-ts solves this by giving the agent a map:
- **What symbols exist** (classes, functions, imports)
- **Where they live** (file + line number)
- **How they connect** (call graph, inheritance, imports)
- **What they mean** (optional LLM semantic labels)

The agent queries the map instead of searching blind.

## Quick Start

```bash
# Install
bun add graphify-ts

# Build index for a project
import { buildIndex } from 'graphify-ts'
const index = await buildIndex('./src')
// → graphify-out/graph.json

# Query it
import { query } from 'graphify-ts'
const results = await query('graphify-out/graph.json', 'Auth')
// → [{ id: 'auth::login', label: 'login', sourceFile: 'auth.py', sourceLocation: 'auth.py:5' }]

# Update after editing files
import { updateIndex } from 'graphify-ts'
await updateIndex('graphify-out/graph.json', ['src/auth.py'])
// → { added: 2, removed: 1, updated: 1 }
```

## Supported Languages

| Language | Extensions | AST Features |
|----------|-----------|-------------|
| Python | `.py` | classes, functions, imports, inheritance, call graph |
| JavaScript | `.js`, `.jsx` | classes, functions, arrow functions, imports, call graph |
| TypeScript | `.ts`, `.tsx` | classes, functions, arrow functions, imports, call graph |
| Go | `.go` | functions, imports, call graph |
| Rust | `.rs` | structs, enums, traits, functions, use declarations, call graph |
| Java | `.java` | classes, interfaces, methods, constructors, imports, call graph |
| C | `.c`, `.h` | functions, includes, call graph |
| C++ | `.cpp`, `.cc`, `.cxx`, `.hpp` | classes, functions, includes, call graph |
| Ruby | `.rb` | classes, methods, call graph |
| C# | `.cs` | classes, interfaces, methods, using directives, call graph |
| Kotlin | `.kt`, `.kts` | classes, objects, functions, imports, call graph |
| Scala | `.scala` | classes, objects, functions, imports, call graph |
| PHP | `.php` | classes, functions, methods, namespace uses, call graph |

## API

### `buildIndex(dir, options?)`

Scan a directory and build a full knowledge graph.

```typescript
const index = await buildIndex('./src', {
  outputDir: './graphify-out'  // optional, defaults to <dir>/../graphify-out
})
```

Returns a `GraphifyIndex` with `nodes`, `edges`, and `metadata`.

### `query(graphPath, question)`

Search the graph for symbols matching a name.

```typescript
const results = await query('graphify-out/graph.json', 'UserService')
// Returns: GraphNode[] with id, label, sourceFile, sourceLocation
```

### `updateIndex(graphPath, changedFiles)`

Incrementally update the graph after editing files. Only re-extracts the changed files.

```typescript
const diff = await updateIndex('graphify-out/graph.json', [
  'src/auth.ts',
  'src/database.ts'
])
// Returns: { added: number, removed: number, updated: number }
```

### `extractFile(filePath)`

Extract AST nodes and edges from a single file.

```typescript
import { extractFile } from 'graphify-ts'
const result = await extractFile('src/main.py')
// Returns: { nodes: NodeDict[], edges: EdgeDict[] }
```

### Graph Query Functions

```typescript
import { findSymbol, callersOf, calleesOf, fileSymbols, shortestPath } from 'graphify-ts'

// Find symbols by name (case-insensitive)
findSymbol(graph, 'login')

// Who calls this function?
callersOf(graph, 'auth::hash_password')

// What does this function call?
calleesOf(graph, 'main::setup')

// All symbols in a file
fileSymbols(graph, 'src/auth.py')

// How are two symbols connected?
shortestPath(graph, 'main::app', 'utils::helper')
```

### Semantic Labeling

Add domain labels to symbols using Claude:

```typescript
import { labelNodes, createClaudeLabeler } from 'graphify-ts'

const labeler = createClaudeLabeler()  // uses ANTHROPIC_API_KEY
await labelNodes(graph, labeler)

// Now nodes have semanticLabels: ["authentication", "security"]
```

### Graph Diff

Compare two graph snapshots:

```typescript
import { graphDiff } from 'graphify-ts'

const diff = graphDiff(oldGraph, newGraph)
// { newNodes, removedNodes, newEdges, removedEdges, summary }
```

## Graph Schema

```json
{
  "nodes": [{
    "id": "main::app",
    "label": "App",
    "fileType": "code",
    "sourceFile": "main.py",
    "sourceLocation": "main.py:5",
    "semanticLabels": ["application", "entry-point"]
  }],
  "edges": [{
    "source": "file::main",
    "target": "main::app",
    "relation": "contains",
    "confidence": "EXTRACTED",
    "weight": 1.0
  }],
  "metadata": {
    "files": 10,
    "nodes": 45,
    "edges": 62,
    "builtAt": "2026-04-09T06:00:00.000Z"
  }
}
```

### Edge Relations

| Relation | Confidence | Meaning |
|----------|-----------|---------|
| `contains` | EXTRACTED | File contains a class/function |
| `method` | EXTRACTED | Class contains a method |
| `imports` | EXTRACTED | File imports a module |
| `imports_from` | EXTRACTED | File imports specific names from a module |
| `inherits` | EXTRACTED | Class inherits from another |
| `calls` | INFERRED | Function calls another function |

## Claude Code Skill

graphify-ts ships as a Claude Code skill. Use `/graphify` to build, query, and update the index from within Claude Code.

See [skill.md](./skill.md) for the full skill definition.

## Architecture

```
src/
├── index.ts          # Public API: buildIndex, query, updateIndex
├── detect.ts         # File discovery + classification
├── cache.ts          # SHA256 incremental cache
├── extract.ts        # Generic tree-sitter AST extraction engine
├── languages/        # Per-language configs (12 languages)
│   ├── types.ts      # LanguageConfig interface
│   ├── index.ts      # Language registry
│   ├── python.ts     # Python config + import handler
│   ├── javascript.ts # JS/TS config + arrow function handler
│   └── ...           # Go, Rust, Java, C/C++, Ruby, C#, Kotlin, Scala, PHP
├── graph.ts          # graphology graph build/merge/serialize
├── query.ts          # Symbol search, callers, callees, shortest path
├── diff.ts           # Graph snapshot comparison
└── semantic.ts       # LLM semantic labeling
```

**Key dependencies:**
- `web-tree-sitter` (0.24.7) — WASM-based AST parsing
- `tree-sitter-wasms` — Pre-built WASM grammars for 12 languages
- `graphology` — Graph data structure
- `@anthropic-ai/sdk` — Claude API for semantic labeling

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run a specific test
bun test tests/languages/python.test.ts
```

## License

MIT
