# Claude Code 集成

graphify-ts 被设计为 AI Agent 的导航层。它作为 Claude Code skill 发布，Agent 可以在编码会话中调用。

## 安装 Skill

将 `skill.md` 复制到你的 Claude Code skills 目录：

```bash
mkdir -p ~/.claude/skills/graphify-ts
cp skill.md ~/.claude/skills/graphify-ts/SKILL.md
```

或在项目的 `.claude/settings.json` 中引用。

## 使用 Skill

### 构建索引

在 Claude Code 会话中：

```
/graphify build
```

这会扫描当前目录并生成 `graphify-out/graph.json`。

### 查询索引

```
/graphify query AuthService
```

返回匹配的符号和文件位置，让 Agent 知道去哪里找。

### 编辑后更新

```
/graphify update src/auth.ts src/models/user.ts
```

只重新提取变更的文件，然后合并回图谱。

### 语义标注

```
/graphify label
```

使用 Claude 为符号分配领域标签（如 "authentication"、"database"）。

## Agent 应该如何使用

### 导航模式

1. **搜索代码之前：** 先查图谱。与其 `grep -r "auth"`，不如查询图谱中的 "auth"，获取精确的文件位置和模块结构。

2. **编辑代码之后：** 更新图谱，让后续查询反映当前状态。这就是 "Agent 维护自己的地图" 模式。

3. **探索陌生代码时：** 使用 `callersOf` 和 `calleesOf` 追踪执行路径。使用 `shortestPath` 理解远距离模块如何连接。

### 自动更新 Hook

要实现完全自主运行，设置 PostToolUse hook，在每次 Edit 或 Write 后运行 `updateIndex`：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "if [ -f graphify-out/graph.json ]; then bun run graphify-ts/src/index.ts update graphify-out/graph.json $CHANGED_FILE; fi"
      }
    ]
  }
}
```

这样导航层会自动保持同步，无需手动干预。

### 上下文注入

设置 PreToolUse hook，在 Glob/Grep 之前注入图谱上下文：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Glob|Grep",
        "command": "if [ -f graphify-out/graph.json ]; then echo '知识图谱可用。搜索前请先查看 graphify-out/graph.json 中的符号位置。'; fi"
      }
    ]
  }
}
```

## 工作流示例

```
Human: 找到并修复这个项目中的认证 bug。

Agent: 让我先查看代码导航图谱。
/graphify query auth

找到：
- auth::login (src/auth.ts:15)
- auth::verify_token (src/auth.ts:42)
- auth::middleware (src/middleware.ts:8)

让我读取相关文件...
[读取 src/auth.ts，找到 bug]
[修复 bug]

现在更新图谱。
/graphify update src/auth.ts

图谱已更新：0 个新节点，0 个已删除，1 个文件重新提取。
```

Agent 直接导航到正确的文件，不需要 grep 猜测。
