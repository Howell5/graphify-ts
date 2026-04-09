# 高级用法

这些是用于在 graphify-ts 之上构建自定义 agent 工具的编程 API。大多数用户只需要 CLI（`graphify build/query/update`）。

## 图谱查询 API

```typescript
import { buildGraph } from 'graphify-ts'
import { findSymbol, callersOf, calleesOf, fileSymbols, shortestPath } from 'graphify-ts'
import { readFileSync } from 'node:fs'

// 加载图谱
const index = JSON.parse(readFileSync('graphify-out/graph.json', 'utf-8'))
const graph = buildGraph({ nodes: index.nodes, edges: index.edges })

// 查找所有匹配 "auth" 的符号（不区分大小写）
const authSymbols = findSymbol(graph, 'auth')
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
```

### 路径查找

```typescript
// 两个远距离的符号如何连接？
const path = shortestPath(graph, 'main::app', 'utils::helper')
// → ['main::app', 'main::setup', 'utils::helper']
```

## 语义标注

`labelNodes` 接受任何符合 `SemanticLabeler` 接口的函数。在 Claude Code 中运行时，agent 自身提供标注逻辑——不需要 API key。

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

### 选项

```typescript
// 跳过已有标签的节点
await labelNodes(graph, labeler, { skipLabeled: true })

// 控制批量大小
await labelNodes(graph, labeler, { batchSize: 25 })
```

## 图谱 Diff

追踪代码库结构随时间的变化。

```typescript
import { graphDiff } from 'graphify-ts'

const diff = graphDiff(oldGraph, newGraph)
console.log(diff.summary)
// → "3 new nodes, 1 node removed, 2 new edges"
```

## 缓存

graphify-ts 使用 SHA256 哈希为每个文件缓存提取结果。运行 `graphify build` 或 `graphify update` 时：

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

// 遍历
graph.forEachNode((id, attrs) => {
  console.log(id, attrs.label, attrs.sourceFile)
})

graph.forEachEdge((key, attrs, source, target) => {
  console.log(`${source} --${attrs.relation}--> ${target}`)
})
```
