# 快速入门

## 安装

```bash
bun add graphify-ts
```

或者克隆到本地使用：

```bash
git clone https://github.com/Howell5/graphify-ts.git
cd graphify-ts
bun install
```

## 你的第一个索引

### 1. 构建索引

```typescript
import { buildIndex } from 'graphify-ts'

const index = await buildIndex('./src', {
  outputDir: './graphify-out'
})

console.log(`索引了 ${index.metadata.files} 个文件`)
console.log(`发现了 ${index.metadata.nodes} 个符号`)
console.log(`发现了 ${index.metadata.edges} 个关系`)
```

这会扫描 `./src` 中所有支持的源文件，提取 AST 结构，并将结果保存到 `./graphify-out/graph.json`。

### 2. 查询索引

```typescript
import { query } from 'graphify-ts'

const results = await query('./graphify-out/graph.json', 'UserService')

for (const node of results) {
  console.log(`${node.label} → ${node.sourceFile}:${node.sourceLocation}`)
}
```

### 3. 保持更新

编辑文件后，增量更新索引：

```typescript
import { updateIndex } from 'graphify-ts'

const diff = await updateIndex('./graphify-out/graph.json', [
  'src/auth.ts',
  'src/models/user.ts'
])

console.log(`新增 ${diff.added} 个节点，删除 ${diff.removed} 个节点`)
```

只有变更的文件会被重新提取，其他的保持缓存。

## 提取了什么

对于每个源文件，graphify-ts 提取：

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
| 函数 → 函数 | "这个函数调用了那个函数" |

## 输出示例

给定这个 Python 文件：

```python
# auth.py
import hashlib
from database import get_user

class AuthService:
    def login(self, username, password):
        user = get_user(username)
        return self.verify(user, password)

    def verify(self, user, password):
        hashed = hashlib.sha256(password.encode()).hexdigest()
        return user.password == hashed
```

graphify-ts 产出：

**节点：**
- `file::auth` (auth.py)
- `auth::authservice` (AuthService)
- `auth::authservice::login` (.login)
- `auth::authservice::verify` (.verify)

**边：**
- `file::auth` → `auth::authservice` (contains / 包含)
- `auth::authservice` → `auth::authservice::login` (method / 方法)
- `auth::authservice` → `auth::authservice::verify` (method / 方法)
- `file::auth` → `mod::hashlib` (imports / 导入)
- `file::auth` → `mod::database::get_user` (imports_from / 从模块导入)
- `auth::authservice::login` → `verify` (calls / 调用, INFERRED)

## 下一步

- [高级用法](./advanced-usage.zh-CN.md) — 图谱查询、语义标注、diff
- [Claude Code 集成](./claude-code-integration.zh-CN.md) — 作为 Claude Code skill 使用
- [添加语言支持](./adding-languages.zh-CN.md) — 扩展新的语言支持
