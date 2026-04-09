[English](./README.md) | 简体中文

# graphify-ts

面向 AI 编程 Agent 的代码导航层。不是给人类安装的库——是一个让 Agent 具备代码库结构感知能力的 skill。

基于 tree-sitter WASM（12 种语言）+ graphology 构建。作为 Claude Code skill 运行。

## 它做什么

当 AI Agent 进入一个陌生的代码库时，它会猜测该读哪些文件、用关键词搜索、打开错误的文件、浪费 token。

graphify-ts 给 Agent 一张结构地图：
- **有哪些符号** — 12 种语言的类、函数、导入
- **它们在哪里** — 文件 + 行号
- **它们如何连接** — 调用图、继承、导入关系
- **它们是什么含义** — 可选的语义标签（由 Agent 自身提供）

Agent 查询地图而不是盲目搜索。编辑代码后，它更新地图保持同步。

## 工作流程

```
Agent 开始会话
  → /graphify build
  → 创建 graphify-out/graph.json（整个代码库的 AST 索引）

Agent 需要找到认证相关代码
  → /graphify query auth
  → 返回: auth::login (src/auth.ts:15), auth::middleware (src/middleware.ts:8)
  → Agent 直接读取正确的文件

Agent 编辑了 src/auth.ts
  → /graphify update src/auth.ts
  → 图谱增量更新（只重新提取变更的文件）
```

不需要 API key。不需要外部服务。Agent 自身就是运行时。

## Claude Code Skill

这是主要的使用接口。详见 [skill.md](./skill.md)。

```
/graphify build         — 索引当前项目
/graphify query <name>  — 按名称查找符号
/graphify update <file> — 编辑后重新索引
/graphify label         — Agent 分配语义领域标签
```

## 支持的语言

Python, JavaScript, TypeScript (JSX/TSX), Go, Rust, Java, C, C++, Ruby, C#, Kotlin, Scala, PHP

全部通过 tree-sitter WASM — 确定性 AST 提取，结构提取不需要 LLM。

## 图谱结构

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

### 边的关系类型

| 关系 | 置信度 | 含义 |
|------|--------|------|
| `contains` | EXTRACTED | 文件包含一个类/函数 |
| `method` | EXTRACTED | 类包含一个方法 |
| `imports` | EXTRACTED | 文件导入一个模块 |
| `imports_from` | EXTRACTED | 文件从模块中导入名称 |
| `inherits` | EXTRACTED | 类继承自另一个类 |
| `calls` | INFERRED | 函数调用另一个函数 |

## 能力列表

Skill 向 Agent 暴露的能力：

| 函数 | 用途 |
|------|------|
| `buildIndex(dir)` | 全量 AST 扫描 → graph.json |
| `query(graphPath, name)` | 符号搜索（不区分大小写） |
| `updateIndex(graphPath, files)` | 增量重新提取 |
| `findSymbol(graph, name)` | 按标签查找节点 |
| `callersOf(graph, nodeId)` | 谁调用了这个函数？ |
| `calleesOf(graph, nodeId)` | 这个函数调用了什么？ |
| `fileSymbols(graph, file)` | 文件中的所有符号 |
| `shortestPath(graph, a, b)` | 两个符号如何连接？ |
| `graphDiff(old, new)` | 两个快照之间有什么变化？ |
| `labelNodes(graph, labeler)` | 分配语义领域标签 |

## 架构

```
src/
├── index.ts          # 公共 API: buildIndex, query, updateIndex
├── detect.ts         # 文件发现 + 分类
├── cache.ts          # SHA256 增量缓存
├── extract.ts        # 通用 tree-sitter AST 提取引擎
├── languages/        # 每种语言的 LanguageConfig（12 种语言）
├── graph.ts          # graphology 图构建/合并/序列化
├── query.ts          # 符号搜索、调用者、被调用者、最短路径
├── diff.ts           # 图谱快照对比
└── semantic.ts       # 可插拔的语义标注接口
```

**依赖：** `web-tree-sitter` (0.24.7), `tree-sitter-wasms`, `graphology`

## 文档

- [Getting Started](./docs/getting-started.md) | [快速入门](./docs/getting-started.zh-CN.md)
- [Advanced Usage](./docs/advanced-usage.md) | [高级用法](./docs/advanced-usage.zh-CN.md)
- [Claude Code Integration](./docs/claude-code-integration.md) | [Claude Code 集成](./docs/claude-code-integration.zh-CN.md)
- [Adding Languages](./docs/adding-languages.md) | [添加语言支持](./docs/adding-languages.zh-CN.md)

## 开发

```bash
bun install && bun test   # 70 个测试，12 种语言
```

## 许可

MIT
