# 高级用法

## 图谱查询 API

构建索引后，可以对图谱结构进行丰富的查询。

### 符号搜索

```typescript
import { buildGraph, mergeExtractions } from 'graphify-ts'
import { findSymbol, callersOf, calleesOf, fileSymbols, shortestPath } from 'graphify-ts'

// 加载图谱
const index = JSON.parse(await Bun.file('graphify-out/graph.json').text())
const graph = buildGraph({ nodes: index.nodes, edges: index.edges })

// 查找所有匹配 "auth" 的符号（不区分大小写）
const authSymbols = findSymbol(graph, 'auth')
// → [{ id: 'auth::login', label: 'login', sourceFile: 'auth.py', ... }]
```

### 调用图遍历

```typescript
// 谁调用了 login 函数？
const callers = callersOf(graph, 'auth::login')

// setup() 调用了什么？
const callees = calleesOf(graph, 'main::setup')
```

注意：图谱以无向图存储。调用方向保存在边属性（`_src`, `_tgt`）中，查询函数会自动处理。

### 文件探索

```typescript
// auth.py 中定义了哪些符号？
const symbols = fileSymbols(graph, 'auth.py')
// → [{ id: 'auth::login', label: 'login' }, { id: 'auth::verify', label: 'verify' }]
```

### 路径查找

```typescript
// 两个远距离的符号如何连接？
const path = shortestPath(graph, 'main::app', 'utils::helper')
// → ['main::app', 'main::setup', 'utils::helper']
// 含义: App → setup() → helper()（通过 calls 边）
```

## 语义标注

使用 Claude 为图谱添加领域标签。

### 基本用法

`labelNodes` 接受任何符合 `SemanticLabeler` 接口的函数。在 Claude Code 中运行时，agent 自身提供标注逻辑——不需要 API key。

```typescript
import { labelNodes, type SemanticLabeler } from 'graphify-ts'

const labeler: SemanticLabeler = async (nodes) => {
  const labels = new Map<string, string[]>()
  for (const node of nodes) {
    // 你的逻辑——启发式规则、LLM 调用等
    if (node.label.includes('auth')) labels.set(node.id, ['authentication'])
  }
  return labels
}

await labelNodes(graph, labeler)
```

标注后，节点会获得 `semanticLabels` 字段：
```json
{
  "id": "auth::login",
  "label": "login",
  "semanticLabels": ["authentication", "user-session"]
}
```

### 自定义标注器

你可以提供自己的标注函数：

```typescript
import type { SemanticLabeler } from 'graphify-ts'

const myLabeler: SemanticLabeler = async (nodes) => {
  const labels = new Map<string, string[]>()
  for (const node of nodes) {
    // 你的自定义逻辑
    if (node.label.includes('auth')) {
      labels.set(node.id, ['authentication'])
    }
  }
  return labels
}

await labelNodes(graph, myLabeler)
```

### 跳过已标注的节点

```typescript
await labelNodes(graph, labeler, { skipLabeled: true })
```

### 批量大小控制

```typescript
await labelNodes(graph, labeler, { batchSize: 25 })
```

## 图谱 Diff

追踪代码库结构随时间的变化。

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

## 缓存

graphify-ts 使用 SHA256 哈希为每个文件缓存提取结果。当你调用 `buildIndex` 或 `updateIndex` 时：

1. 每个文件的内容 + 路径被哈希
2. 如果哈希匹配缓存条目，使用缓存结果
3. 只有变更的文件被重新提取

缓存文件存储在 `graphify-out/cache/` 中，格式为 JSON。

### 清除缓存

```typescript
import { clearCache } from 'graphify-ts'
await clearCache('./graphify-out')
```

## 直接访问图谱

对于高级用例，你可以直接操作 graphology 图谱：

```typescript
import { buildGraph, serializeGraph, deserializeGraph } from 'graphify-ts'

const graph = buildGraph(extraction)

// graphology API
graph.order        // 节点数量
graph.size         // 边数量
graph.nodes()      // 所有节点 ID
graph.neighbors(id) // 相邻节点

// 遍历节点
graph.forEachNode((id, attrs) => {
  console.log(id, attrs.label, attrs.sourceFile)
})

// 遍历边
graph.forEachEdge((key, attrs, source, target) => {
  console.log(`${source} --${attrs.relation}--> ${target}`)
})

// 序列化存储
const json = serializeGraph(graph)
await Bun.write('graph.json', json)

// 稍后恢复
const restored = deserializeGraph(await Bun.file('graph.json').text())
```
