# Advanced Usage

These are programmatic APIs for building custom agent tooling on top of graphify-ts. Most users only need the CLI (`graphify build/query/update`).

## Graph Query API

```typescript
import { buildGraph } from 'graphify-ts'
import { findSymbol, callersOf, calleesOf, fileSymbols, shortestPath } from 'graphify-ts'
import { readFileSync } from 'node:fs'

// Load the graph
const index = JSON.parse(readFileSync('graphify-out/graph.json', 'utf-8'))
const graph = buildGraph({ nodes: index.nodes, edges: index.edges })

// Find all symbols matching "auth" (case-insensitive)
const authSymbols = findSymbol(graph, 'auth')
```

### Call Graph Traversal

```typescript
// Who calls the login function?
const callers = callersOf(graph, 'auth::login')

// What does setup() call?
const callees = calleesOf(graph, 'main::setup')
```

Note: The graph is stored as undirected. Call direction is preserved in edge attributes (`_src`, `_tgt`), and the query functions handle this automatically.

### File Exploration

```typescript
// What symbols are defined in auth.py?
const symbols = fileSymbols(graph, 'auth.py')
```

### Path Finding

```typescript
// How are two distant symbols connected?
const path = shortestPath(graph, 'main::app', 'utils::helper')
// → ['main::app', 'main::setup', 'utils::helper']
```

## Semantic Labeling

`labelNodes` accepts any function matching the `SemanticLabeler` interface. When running inside Claude Code, the agent itself provides the labeling logic — no API key needed.

```typescript
import { labelNodes, type SemanticLabeler } from 'graphify-ts'

const labeler: SemanticLabeler = async (nodes) => {
  const labels = new Map<string, string[]>()
  for (const node of nodes) {
    if (node.label.includes('auth')) labels.set(node.id, ['authentication'])
  }
  return labels
}

await labelNodes(graph, labeler)
```

### Options

```typescript
// Skip nodes that already have labels
await labelNodes(graph, labeler, { skipLabeled: true })

// Control batch size
await labelNodes(graph, labeler, { batchSize: 25 })
```

## Graph Diff

Track how the codebase structure changes over time.

```typescript
import { graphDiff } from 'graphify-ts'

const diff = graphDiff(oldGraph, newGraph)
console.log(diff.summary)
// → "3 new nodes, 1 node removed, 2 new edges"
```

## Caching

graphify-ts caches extraction results per file using SHA256 hashes. When you run `graphify build` or `graphify update`:

1. Each file's content + path is hashed
2. If the hash matches a cached entry, the cached result is used
3. Only changed files are re-extracted

Cache files are stored in `graphify-out/cache/` as JSON.

### Clearing the Cache

```typescript
import { clearCache } from 'graphify-ts'
await clearCache('./graphify-out')
```

## Direct Graph Access

For advanced use cases, you can work with the graphology graph directly:

```typescript
import { buildGraph, serializeGraph, deserializeGraph } from 'graphify-ts'

const graph = buildGraph(extraction)

// graphology API
graph.order        // number of nodes
graph.size         // number of edges
graph.nodes()      // all node IDs
graph.neighbors(id) // adjacent nodes

// Iterate
graph.forEachNode((id, attrs) => {
  console.log(id, attrs.label, attrs.sourceFile)
})

graph.forEachEdge((key, attrs, source, target) => {
  console.log(`${source} --${attrs.relation}--> ${target}`)
})
```
