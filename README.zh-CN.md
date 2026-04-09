[English](./README.md) | 简体中文

# graphify-ts

面向 AI Agent 的代码导航层。通过 tree-sitter WASM 从 12 种编程语言中提取 AST 结构，构建可查询的知识图谱，并在代码变更时保持同步。

**这不是一个可视化工具。** 这是一个始终在线的结构化索引，帮助 Agent 通过理解代码中"有什么、在哪里、怎么连接"来导航代码库——在它开始 grep 之前。

## 为什么需要它

当 AI Agent 进入一个陌生的代码库时，它会猜测该读哪些文件、用关键词搜索、打开错误的文件、浪费 token。

graphify-ts 给 Agent 一张地图：
- **有哪些符号**（类、函数、导入）
- **它们在哪里**（文件 + 行号）
- **它们如何连接**（调用图、继承、导入关系）
- **它们是什么含义**（可选的 LLM 语义标签）

Agent 查询地图，而不是盲目搜索。

## 快速开始

```bash
# 安装
bun add graphify-ts

# 为项目构建索引
import { buildIndex } from 'graphify-ts'
const index = await buildIndex('./src')
// → graphify-out/graph.json

# 查询
import { query } from 'graphify-ts'
const results = await query('graphify-out/graph.json', 'Auth')
// → [{ id: 'auth::login', label: 'login', sourceFile: 'auth.py', sourceLocation: 'auth.py:5' }]

# 编辑文件后增量更新
import { updateIndex } from 'graphify-ts'
await updateIndex('graphify-out/graph.json', ['src/auth.py'])
// → { added: 2, removed: 1, updated: 1 }
```

## 支持的语言

| 语言 | 扩展名 | AST 特性 |
|------|--------|---------|
| Python | `.py` | 类、函数、导入、继承、调用图 |
| JavaScript | `.js`, `.jsx` | 类、函数、箭头函数、导入、调用图 |
| TypeScript | `.ts`, `.tsx` | 类、函数、箭头函数、导入、调用图 |
| Go | `.go` | 函数、导入、调用图 |
| Rust | `.rs` | 结构体、枚举、trait、函数、use 声明、调用图 |
| Java | `.java` | 类、接口、方法、构造函数、导入、调用图 |
| C | `.c`, `.h` | 函数、include、调用图 |
| C++ | `.cpp`, `.cc`, `.cxx`, `.hpp` | 类、函数、include、调用图 |
| Ruby | `.rb` | 类、方法、调用图 |
| C# | `.cs` | 类、接口、方法、using 指令、调用图 |
| Kotlin | `.kt`, `.kts` | 类、对象、函数、导入、调用图 |
| Scala | `.scala` | 类、对象、函数、导入、调用图 |
| PHP | `.php` | 类、函数、方法、命名空间 use、调用图 |

## API

### `buildIndex(dir, options?)`

扫描目录，构建完整的知识图谱。

```typescript
const index = await buildIndex('./src', {
  outputDir: './graphify-out'  // 可选，默认 <dir>/../graphify-out
})
```

返回 `GraphifyIndex`，包含 `nodes`、`edges` 和 `metadata`。

### `query(graphPath, question)`

在图谱中搜索匹配名称的符号。

```typescript
const results = await query('graphify-out/graph.json', 'UserService')
// 返回: GraphNode[]，包含 id, label, sourceFile, sourceLocation
```

### `updateIndex(graphPath, changedFiles)`

编辑文件后增量更新图谱。只重新提取变更的文件。

```typescript
const diff = await updateIndex('graphify-out/graph.json', [
  'src/auth.ts',
  'src/database.ts'
])
// 返回: { added: number, removed: number, updated: number }
```

### `extractFile(filePath)`

从单个文件中提取 AST 节点和边。

```typescript
import { extractFile } from 'graphify-ts'
const result = await extractFile('src/main.py')
// 返回: { nodes: NodeDict[], edges: EdgeDict[] }
```

### 图谱查询函数

```typescript
import { findSymbol, callersOf, calleesOf, fileSymbols, shortestPath } from 'graphify-ts'

// 按名称查找符号（不区分大小写）
findSymbol(graph, 'login')

// 谁调用了这个函数？
callersOf(graph, 'auth::hash_password')

// 这个函数调用了什么？
calleesOf(graph, 'main::setup')

// 文件中的所有符号
fileSymbols(graph, 'src/auth.py')

// 两个符号之间如何连接？
shortestPath(graph, 'main::app', 'utils::helper')
```

### 语义标注

使用 Claude 为符号添加领域标签：

```typescript
import { labelNodes, createClaudeLabeler } from 'graphify-ts'

const labeler = createClaudeLabeler()  // 使用 ANTHROPIC_API_KEY
await labelNodes(graph, labeler)

// 现在节点有了 semanticLabels: ["authentication", "security"]
```

### 图谱 Diff

比较两个图谱快照：

```typescript
import { graphDiff } from 'graphify-ts'

const diff = graphDiff(oldGraph, newGraph)
// { newNodes, removedNodes, newEdges, removedEdges, summary }
```

## 图谱结构

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

### 边的关系类型

| 关系 | 置信度 | 含义 |
|------|--------|------|
| `contains` | EXTRACTED | 文件包含一个类/函数 |
| `method` | EXTRACTED | 类包含一个方法 |
| `imports` | EXTRACTED | 文件导入一个模块 |
| `imports_from` | EXTRACTED | 文件从模块中导入特定名称 |
| `inherits` | EXTRACTED | 类继承自另一个类 |
| `calls` | INFERRED | 函数调用另一个函数 |

## Claude Code Skill

graphify-ts 作为 Claude Code skill 发布。在 Claude Code 中使用 `/graphify` 来构建、查询和更新索引。

详见 [skill.md](./skill.md)。

## 架构

```
src/
├── index.ts          # 公共 API: buildIndex, query, updateIndex
├── detect.ts         # 文件发现 + 分类
├── cache.ts          # SHA256 增量缓存
├── extract.ts        # 通用 tree-sitter AST 提取引擎
├── languages/        # 每种语言的配置（12 种语言）
│   ├── types.ts      # LanguageConfig 接口
│   ├── index.ts      # 语言注册表
│   ├── python.ts     # Python 配置 + 导入处理器
│   ├── javascript.ts # JS/TS 配置 + 箭头函数处理器
│   └── ...           # Go, Rust, Java, C/C++, Ruby, C#, Kotlin, Scala, PHP
├── graph.ts          # graphology 图构建/合并/序列化
├── query.ts          # 符号搜索、调用者、被调用者、最短路径
├── diff.ts           # 图谱快照对比
└── semantic.ts       # LLM 语义标注
```

**核心依赖：**
- `web-tree-sitter` (0.24.7) — 基于 WASM 的 AST 解析
- `tree-sitter-wasms` — 12 种语言的预构建 WASM 语法
- `graphology` — 图数据结构
- `@anthropic-ai/sdk` — Claude API 语义标注

## 开发

```bash
# 安装依赖
bun install

# 运行测试
bun test

# 运行特定测试
bun test tests/languages/python.test.ts
```

## 许可

MIT
