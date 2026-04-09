# Advanced Usage

## Graph Query API

After building an index, you can perform rich queries on the graph structure.

### Symbol Search

```typescript
import { buildGraph, mergeExtractions } from 'graphify-ts'
import { findSymbol, callersOf, calleesOf, fileSymbols, shortestPath } from 'graphify-ts'

// Load the graph
const index = JSON.parse(await Bun.file('graphify-out/graph.json').text())
const graph = buildGraph({ nodes: index.nodes, edges: index.edges })

// Find all symbols matching "auth" (case-insensitive)
const authSymbols = findSymbol(graph, 'auth')
// → [{ id: 'auth::login', label: 'login', sourceFile: 'auth.py', ... }]
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
// → [{ id: 'auth::login', label: 'login' }, { id: 'auth::verify', label: 'verify' }]
```

### Path Finding

```typescript
// How are two distant symbols connected?
const path = shortestPath(graph, 'main::app', 'utils::helper')
// → ['main::app', 'main::setup', 'utils::helper']
// Meaning: App → setup() → helper() (via calls edges)
```

## Semantic Labeling

Enrich the graph with domain labels using Claude.

### Basic Usage

`labelNodes` accepts any function matching the `SemanticLabeler` interface. When running inside Claude Code, the agent itself provides the labeling logic — no API key needed.

```typescript
import { labelNodes, type SemanticLabeler } from 'graphify-ts'

const labeler: SemanticLabeler = async (nodes) => {
  const labels = new Map<string, string[]>()
  for (const node of nodes) {
    // Your logic here — heuristics, LLM calls, etc.
    if (node.label.includes('auth')) labels.set(node.id, ['authentication'])
  }
  return labels
}

await labelNodes(graph, labeler)
```

After labeling, nodes gain a `semanticLabels` field:
```json
{
  "id": "auth::login",
  "label": "login",
  "semanticLabels": ["authentication", "user-session"]
}
```

### Custom Labeler

You can provide your own labeling function:

```typescript
import type { SemanticLabeler } from 'graphify-ts'

const myLabeler: SemanticLabeler = async (nodes) => {
  const labels = new Map<string, string[]>()
  for (const node of nodes) {
    // Your custom logic
    if (node.label.includes('auth')) {
      labels.set(node.id, ['authentication'])
    }
  }
  return labels
}

await labelNodes(graph, myLabeler)
```

### Skip Already-Labeled Nodes

```typescript
await labelNodes(graph, labeler, { skipLabeled: true })
```

### Batch Size Control

```typescript
await labelNodes(graph, labeler, { batchSize: 25 })
```

## Graph Diff

Track how the codebase structure changes over time.

```typescript
import { graphDiff } from 'graphify-ts'

const diff = graphDiff(oldGraph, newGraph)

console.log(diff.summary)
// → "3 new nodes, 1 node removed, 2 new edges"

for (const node of diff.newNodes) {
  console.log(`+ ${node.label}`)
}

for (const node of diff.removedNodes) {
  console.log(`- ${node.label}`)
}
```

## Caching

graphify-ts caches extraction results per file using SHA256 hashes. When you call `buildIndex` or `updateIndex`:

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

// Iterate nodes
graph.forEachNode((id, attrs) => {
  console.log(id, attrs.label, attrs.sourceFile)
})

// Iterate edges
graph.forEachEdge((key, attrs, source, target) => {
  console.log(`${source} --${attrs.relation}--> ${target}`)
})

// Serialize for storage
const json = serializeGraph(graph)
await Bun.write('graph.json', json)

// Restore later
const restored = deserializeGraph(await Bun.file('graph.json').text())
```
