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

### 3. 安装自动更新 hook

```bash
graphify hook install
```

这会将 Stop hook 写入 `~/.claude/settings.json`。每次 Claude Code 会话结束后，图谱会基于 `git diff` 自动更新。Agent 不需要记住任何事。

用 `graphify hook status` 检查状态，`graphify hook uninstall` 可以随时移除。

## 使用 Skill

在 Claude Code 会话中：

```
/graphify build         — 索引当前项目（仅首次）
/graphify query <name>  — 按名称查找符号
```

你**不需要**手动运行 `/graphify update`——Stop hook 会在会话结束时处理。只有在需要手动覆盖（例如会话中途强制同步）时才使用 `/graphify update <file>`。

## Agent 应该如何使用

### 导航模式

1. **搜索代码之前：** 先查图谱。与其 `grep -r "auth"`，不如查询图谱中的 "auth"，获取精确的文件位置。

2. **编辑代码之后：** 什么都不用做。Stop hook 会在会话结束时自动更新图谱。

3. **探索陌生代码时：** 使用 `callersOf` 和 `calleesOf` 追踪执行路径。使用 `shortestPath` 理解远距离模块如何连接。

## 自动更新的工作原理

`graphify hook install` 会在 `~/.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "graphify auto-update \"${CLAUDE_PROJECT_DIR:-.}\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

Claude Code 会话结束时，`graphify auto-update`：

1. 检查 `graphify-out/graph.json` 是否存在（不存在则跳过）
2. 检查目录是否是 git 仓库（不是则跳过）
3. 运行 `git diff --name-only HEAD` + `git ls-files --others --exclude-standard` 找到变更 + 新增的文件
4. 过滤到支持的代码文件扩展名
5. 用绝对路径调用 `updateIndex`

没操作的路径（无索引、无 git、无代码变更）都是静默的，不会污染终端。安装器是幂等的——重复运行不会重复添加 hook。现有配置和其他 hook 会被保留。

### 可选：上下文注入

Claude Code 不需要这个——skill 已经告诉 agent 先查图谱。但如果你想在每次 Glob/Grep 前加一点额外提醒，可以手动添加 PreToolUse hook：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Glob|Grep",
        "command": "[ -f graphify-out/graph.json ] && echo 'graphify 索引可用——搜索前先运行 /graphify query' || true"
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

完成。

[会话结束。Stop hook 自动运行 `graphify auto-update`。
 下次会话时，图谱已反映这次修复。]
```

Agent 直接导航到正确的文件，不需要 grep 猜测，也不需要记住更新索引。
