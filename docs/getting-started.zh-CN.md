# 快速入门

## 安装

```bash
npm i -g graphify-ts
```

需要 [Bun](https://bun.sh) 运行时。

## 安装 Skill（可选）

Skill 会教你的 AI agent 如何自动使用 CLI：

```bash
npx skills add Howell5/willhong-skills -s graphify
```

不装 skill 也可以直接用 CLI。

## 启用自动更新（推荐）

```bash
graphify hook install
```

这会安装一个 Claude Code Stop hook。每次会话结束后，图谱会基于 `git diff` 自动更新——你不再需要手动重新索引。运行 `graphify hook uninstall` 可以移除。

## 构建第一个索引

```bash
cd your-project
graphify build .
```

输出：
```
Scanning /path/to/your-project...
Indexed 42 files, 187 symbols, 214 relationships
Saved to /path/to/your-project/graphify-out/graph.json
```

## 查询索引

```bash
graphify query graphify-out/graph.json UserService
```

输出：
```
UserService → src/services/user.ts:12
.getUser → src/services/user.ts:15
.deleteUser → src/services/user.ts:28
```

## 编辑后更新

如果你装了 Stop hook（`graphify hook install`），**什么都不用做**——图谱会在每次 Claude Code 会话结束时自动更新。

手动更新（没装 hook，或需要中途强制同步）：

```bash
graphify update graphify-out/graph.json src/services/user.ts
```

输出：
```
Updated: +2 nodes, -1 nodes, 1 files re-extracted
```

## 提取了什么

对于每个源文件，graphify 提取：

| 实体 | 示例 | 节点标签 |
|------|------|---------|
| 文件 | `auth.py` | `auth.py` |
| 类 | `class UserService` | `UserService` |
| 函数 | `def login()` | `login` |
| 方法 | 类内的 `def validate(self)` | `.validate` |
| 箭头函数 (JS/TS) | `const fetch = () => {}` | `fetch` |

以及这些关系：

| 关系 | 含义 |
|------|------|
| 文件 → 类 | "这个文件包含这个类" |
| 文件 → 函数 | "这个文件包含这个函数" |
| 类 → 方法 | "这个类有这个方法" |
| 文件 → 模块 | "这个文件导入了这个模块" |
| 类 → 类 | "这个类继承自那个类" |
| 函数 → 函数 | "这个函数调用了那个函数"（INFERRED） |

## 配合 AI Agent 使用

安装 skill 后，agent 可以使用斜杠命令：

```
/graphify build         — 索引当前项目（仅首次）
/graphify query auth    — 查找认证相关符号
```

装了 Stop hook（`graphify hook install`）后，agent 永远不需要手动更新索引——它只负责查询，图谱会自动保持最新。

## 下一步

- [高级用法](./advanced-usage.zh-CN.md) — 图谱查询、语义标注、diff
- [Claude Code 集成](./claude-code-integration.zh-CN.md) — hooks 和自动更新
- [添加语言支持](./adding-languages.zh-CN.md) — 扩展新的语言支持
