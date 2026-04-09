# Claude Code 集成

graphify-ts 被设计为 AI 编程 Agent 的导航层。Skill 告诉 agent 如何使用 `graphify` CLI。

## 安装

### 1. 安装 CLI

```bash
npm i -g graphify-ts
```

### 2. 安装 Skill

```bash
npx skills add Howell5/willhong-skills -s graphify
```

Skill 在 [Howell5/willhong-skills](https://github.com/Howell5/willhong-skills) 仓库中，不在本仓库。它是一个纯 prompt（SKILL.md），教 agent 如何调用 CLI。

## 使用 Skill

在 Claude Code 会话中：

```
/graphify build         — 索引当前项目
/graphify query <name>  — 按名称查找符号
/graphify update <file> — 编辑后重新索引
```

## Agent 应该如何使用

### 导航模式

1. **搜索代码之前：** 先查图谱。与其 `grep -r "auth"`，不如查询图谱中的 "auth"，获取精确的文件位置。

2. **编辑代码之后：** 更新图谱，让后续查询反映当前状态。

3. **探索陌生代码时：** 使用 `callersOf` 和 `calleesOf` 追踪执行路径。使用 `shortestPath` 理解远距离模块如何连接。

## 自动更新 Hook

要实现完全自主运行，设置 PostToolUse hook，在每次 Edit 或 Write 后更新图谱：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "[ -f graphify-out/graph.json ] && graphify update graphify-out/graph.json $CHANGED_FILE || true"
      }
    ]
  }
}
```

### 上下文注入

设置 PreToolUse hook，在搜索前提醒 agent 图谱的存在：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Glob|Grep",
        "command": "[ -f graphify-out/graph.json ] && echo 'graphify 索引可用 — 搜索前先运行 /graphify query' || true"
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
[读取 src/auth.ts，找到 bug，修复]

现在更新图谱。
/graphify update src/auth.ts

Updated: +0 nodes, -0 nodes, 1 file re-extracted.
```

Agent 直接导航到正确的文件，不需要 grep 猜测。
