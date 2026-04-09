# Getting Started

## Installation

```bash
bun add graphify-ts
```

Or clone and use locally:

```bash
git clone https://github.com/Howell5/graphify-ts.git
cd graphify-ts
bun install
```

## Your First Index

### 1. Build the index

```typescript
import { buildIndex } from 'graphify-ts'

const index = await buildIndex('./src', {
  outputDir: './graphify-out'
})

console.log(`Indexed ${index.metadata.files} files`)
console.log(`Found ${index.metadata.nodes} symbols`)
console.log(`Discovered ${index.metadata.edges} relationships`)
```

This scans all supported source files in `./src`, extracts their AST structure, and saves the result to `./graphify-out/graph.json`.

### 2. Query the index

```typescript
import { query } from 'graphify-ts'

const results = await query('./graphify-out/graph.json', 'UserService')

for (const node of results) {
  console.log(`${node.label} → ${node.sourceFile}:${node.sourceLocation}`)
}
```

### 3. Keep it updated

After editing files, update the index incrementally:

```typescript
import { updateIndex } from 'graphify-ts'

const diff = await updateIndex('./graphify-out/graph.json', [
  'src/auth.ts',
  'src/models/user.ts'
])

console.log(`Added ${diff.added} nodes, removed ${diff.removed} nodes`)
```

Only the changed files are re-extracted. Everything else stays cached.

## What Gets Extracted

For each source file, graphify-ts extracts:

| Entity | Example | Node Label |
|--------|---------|------------|
| File | `auth.py` | `auth.py` |
| Class | `class UserService` | `UserService` |
| Function | `def login()` | `login` |
| Method | `def validate(self)` inside a class | `.validate` |
| Arrow Function (JS/TS) | `const fetch = () => {}` | `fetch` |

And these relationships:

| Relationship | Meaning |
|-------------|---------|
| File → Class | "this file contains this class" |
| File → Function | "this file contains this function" |
| Class → Method | "this class has this method" |
| File → Module | "this file imports this module" |
| Class → Class | "this class inherits from that class" |
| Function → Function | "this function calls that function" |

## Example Output

Given this Python file:

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

graphify-ts produces:

**Nodes:**
- `file::auth` (auth.py)
- `auth::authservice` (AuthService)
- `auth::authservice::login` (.login)
- `auth::authservice::verify` (.verify)

**Edges:**
- `file::auth` → `auth::authservice` (contains)
- `auth::authservice` → `auth::authservice::login` (method)
- `auth::authservice` → `auth::authservice::verify` (method)
- `file::auth` → `mod::hashlib` (imports)
- `file::auth` → `mod::database::get_user` (imports_from)
- `auth::authservice::login` → `verify` (calls, INFERRED)

## Next Steps

- [Advanced Usage](./advanced-usage.md) — graph queries, semantic labeling, diff
- [Claude Code Integration](./claude-code-integration.md) — using as a Claude Code skill
- [Adding Languages](./adding-languages.md) — extending with new language support
