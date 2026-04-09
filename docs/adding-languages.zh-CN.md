# 添加语言支持

graphify-ts 使用数据驱动的架构：每种语言由一个 `LanguageConfig` 对象定义，告诉通用提取引擎要查找哪些 tree-sitter 节点类型。

## 工作原理

提取引擎（`src/extract.ts`）遍历 AST，对每个节点检查配置：

1. 这个节点类型在 `importTypes` 中？→ 调用 `importHandler`
2. 这个节点类型在 `classTypes` 中？→ 提取类节点 + 递归遍历 body
3. 这个节点类型在 `functionTypes` 中？→ 提取函数节点 + 保存 body 用于调用图遍历
4. 其他 → 递归子节点

第一遍完成后，第二遍遍历所有保存的函数 body，查找 `callTypes` 节点来构建调用图。

## 添加新语言

### 1. 检查 WASM 可用性

graphify-ts 使用 `tree-sitter-wasms` 提供预构建的 WASM 语法。检查你的语言是否可用：

```bash
ls node_modules/tree-sitter-wasms/out/
```

如果不可用，你可以自己构建：
```bash
npx tree-sitter build --wasm node_modules/tree-sitter-yourlang
```

### 2. 探索语法

使用 [tree-sitter playground](https://tree-sitter.github.io/tree-sitter/playground) 来理解你的语言的 AST。粘贴一个代码示例，记下以下内容的节点类型：

- 类/结构体/接口声明
- 函数/方法声明
- 导入/include 语句
- 函数调用

### 3. 创建配置文件

创建 `src/languages/yourlang.ts`：

```typescript
import type { LanguageConfig, EdgeDict } from "./types";
import type Parser from "web-tree-sitter";

// 导入处理器（如果语言有导入语句）
function yourLangImportHandler(
  node: Parser.SyntaxNode,
  _source: string,
  fileNid: string,
  _stem: string,
  edges: EdgeDict[],
  filePath: string,
): void {
  const line = node.startPosition.row + 1;
  const loc = `${filePath}:${line}`;

  // 从导入节点中提取模块名
  // 每种语言不同——检查 AST 找到正确的字段
  const moduleNode = node.childForFieldName("path");
  if (!moduleNode) return;

  const moduleName = moduleNode.text.replace(/['"]/g, "");
  edges.push({
    source: fileNid,
    target: `mod::${moduleName.toLowerCase()}`,
    relation: "imports",
    confidence: "EXTRACTED",
    sourceFile: filePath,
    sourceLocation: loc,
    weight: 1.0,
  });
}

export const config: LanguageConfig = {
  wasmFile: "tree-sitter-yourlang.wasm",

  // 表示类声明的节点类型
  classTypes: new Set(["class_declaration"]),

  // 表示函数声明的节点类型
  functionTypes: new Set(["function_declaration", "method_declaration"]),

  // 表示导入语句的节点类型
  importTypes: new Set(["import_statement"]),

  // 表示函数调用的节点类型
  callTypes: new Set(["call_expression"]),

  // 提取类/函数名称的字段名
  nameField: "name",
  // 后备：如果 nameField 返回 null，检查的子节点类型
  nameFallbackChildTypes: ["identifier"],

  // 提取类/函数体的字段名
  bodyField: "body",
  // 后备：body 的子节点类型
  bodyFallbackChildTypes: [],

  // 解析调用目标
  callFunctionField: "function",
  callAccessorNodeTypes: new Set(["member_expression"]),
  callAccessorField: "property",

  // 遍历调用表达式时不跨越这些节点边界
  functionBoundaryTypes: new Set(["function_declaration"]),

  importHandler: yourLangImportHandler,
};
```

### 4. 注册语言

在 `src/languages/index.ts` 中添加：

```typescript
// 在扩展名映射中
[".yourlang", "yourlang"],

// 注册配置加载器
registerLanguage("yourlang", () => import("./yourlang").then((m) => m.config));
```

同时在 `src/detect.ts` 的 `CODE_EXTENSIONS` 集合中添加扩展名。

### 5. 编写测试

创建 `tests/languages/yourlang.test.ts`：

```typescript
import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

describe("YourLang extraction", () => {
  test("extracts class and methods", async () => {
    await Bun.write(
      join(__dirname, "../fixtures/sample.yourlang"),
      `你的测试代码`
    );

    const result = await extractFile(
      join(__dirname, "../fixtures/sample.yourlang")
    );

    expect(result.error).toBeUndefined();
    expect(result.nodes.length).toBeGreaterThan(1); // 文件 + 至少一个符号
    expect(result.edges.length).toBeGreaterThan(0);
  });
});
```

### 6. 运行测试

```bash
bun test tests/languages/yourlang.test.ts
```

## LanguageConfig 参考

| 字段 | 类型 | 用途 |
|------|------|------|
| `wasmFile` | `string` | WASM 语法文件名 |
| `classTypes` | `Set<string>` | 类声明的 AST 节点类型 |
| `functionTypes` | `Set<string>` | 函数声明的 AST 节点类型 |
| `importTypes` | `Set<string>` | 导入语句的 AST 节点类型 |
| `callTypes` | `Set<string>` | 函数调用的 AST 节点类型 |
| `nameField` | `string` | 提取名称的 tree-sitter 字段 |
| `nameFallbackChildTypes` | `string[]` | nameField 失败时检查的子类型 |
| `bodyField` | `string` | 提取 body 的 tree-sitter 字段 |
| `bodyFallbackChildTypes` | `string[]` | bodyField 失败时检查的子类型 |
| `callFunctionField` | `string` | 调用节点上被调用者的字段 |
| `callAccessorNodeTypes` | `Set<string>` | 成员访问的节点类型 (obj.method) |
| `callAccessorField` | `string` | 访问器节点上方法名的字段 |
| `functionBoundaryTypes` | `Set<string>` | 调用图遍历时不跨越的边界 |
| `importHandler` | `ImportHandler?` | 导入节点的自定义处理器 |
| `resolveFunctionNameFn` | `ResolveFunctionNameFn?` | 自定义名称解析（C/C++ 声明符） |
| `extraWalkFn` | `ExtraWalkHandler?` | 自定义 AST 遍历（JS 箭头函数、C# 命名空间） |

## 提示

- **从简单开始。** 先让类和函数工作，再添加导入，最后是调用图。
- **使用 playground。** tree-sitter 的在线 playground 对探索语法非常有用。
- **参考现有配置。** `python.ts` 最简单，`c.ts` 展示了自定义名称解析，`javascript.ts` 展示了 `extraWalkFn`。
- **调用图是 INFERRED 的。** 调用解析不需要完美——它是尽力而为的。
