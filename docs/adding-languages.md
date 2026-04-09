# Adding Language Support

graphify-ts uses a data-driven architecture: each language is defined by a `LanguageConfig` object that tells the generic extraction engine which tree-sitter node types to look for.

## How It Works

The extraction engine (`src/extract.ts`) walks the AST and checks each node against the config:

1. Is this node type in `importTypes`? → Call `importHandler`
2. Is this node type in `classTypes`? → Extract class node + recurse body
3. Is this node type in `functionTypes`? → Extract function node + save body for call-graph pass
4. Otherwise → Recurse into children

After the first pass, a second pass walks all saved function bodies looking for `callTypes` nodes to build the call graph.

## Adding a New Language

### 1. Check WASM Availability

graphify-ts uses `tree-sitter-wasms` for pre-built WASM grammars. Check if your language is available:

```bash
ls node_modules/tree-sitter-wasms/out/
```

If not available, you can build it yourself:
```bash
npx tree-sitter build --wasm node_modules/tree-sitter-yourlang
```

### 2. Explore the Grammar

Use [tree-sitter playground](https://tree-sitter.github.io/tree-sitter/playground) to understand your language's AST. Paste a code sample and note the node types for:

- Class/struct/interface declarations
- Function/method declarations
- Import/include statements
- Function calls

### 3. Create the Config File

Create `src/languages/yourlang.ts`:

```typescript
import type { LanguageConfig, EdgeDict } from "./types";
import type Parser from "web-tree-sitter";

// Import handler (if the language has import statements)
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

  // Extract module name from the import node
  // This varies per language — inspect the AST to find the right field
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

  // Node types that represent class-like declarations
  classTypes: new Set(["class_declaration"]),

  // Node types that represent function-like declarations
  functionTypes: new Set(["function_declaration", "method_declaration"]),

  // Node types that represent import statements
  importTypes: new Set(["import_statement"]),

  // Node types that represent function calls
  callTypes: new Set(["call_expression"]),

  // Field name for extracting the name of a class/function
  nameField: "name",
  // Fallback: child node types to check if nameField returns null
  nameFallbackChildTypes: ["identifier"],

  // Field name for extracting the body of a class/function
  bodyField: "body",
  // Fallback: child node types for the body
  bodyFallbackChildTypes: [],

  // For resolving call targets
  callFunctionField: "function",
  callAccessorNodeTypes: new Set(["member_expression"]),
  callAccessorField: "property",

  // Don't cross these node boundaries when walking call expressions
  functionBoundaryTypes: new Set(["function_declaration"]),

  importHandler: yourLangImportHandler,
};
```

### 4. Register the Language

In `src/languages/index.ts`, add:

```typescript
// In the extension map
[".yourlang", "yourlang"],

// Register the config loader
registerLanguage("yourlang", () => import("./yourlang").then((m) => m.config));
```

Also add the extension to `src/detect.ts` in the `CODE_EXTENSIONS` set.

### 5. Write Tests

Create `tests/languages/yourlang.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

describe("YourLang extraction", () => {
  test("extracts class and methods", async () => {
    await Bun.write(
      join(__dirname, "../fixtures/sample.yourlang"),
      `your test code here`
    );

    const result = await extractFile(
      join(__dirname, "../fixtures/sample.yourlang")
    );

    expect(result.error).toBeUndefined();
    expect(result.nodes.length).toBeGreaterThan(1); // file + at least one symbol
    expect(result.edges.length).toBeGreaterThan(0);
  });
});
```

### 6. Run Tests

```bash
bun test tests/languages/yourlang.test.ts
```

## LanguageConfig Reference

| Field | Type | Purpose |
|-------|------|---------|
| `wasmFile` | `string` | WASM grammar filename |
| `classTypes` | `Set<string>` | AST node types for class-like declarations |
| `functionTypes` | `Set<string>` | AST node types for function-like declarations |
| `importTypes` | `Set<string>` | AST node types for import statements |
| `callTypes` | `Set<string>` | AST node types for function calls |
| `nameField` | `string` | tree-sitter field for extracting names |
| `nameFallbackChildTypes` | `string[]` | Child types to check if nameField fails |
| `bodyField` | `string` | tree-sitter field for extracting bodies |
| `bodyFallbackChildTypes` | `string[]` | Child types to check if bodyField fails |
| `callFunctionField` | `string` | Field on call nodes for the callee |
| `callAccessorNodeTypes` | `Set<string>` | Node types for member access (obj.method) |
| `callAccessorField` | `string` | Field on accessor nodes for the method name |
| `functionBoundaryTypes` | `Set<string>` | Don't cross these during call-graph walk |
| `importHandler` | `ImportHandler?` | Custom handler for import nodes |
| `resolveFunctionNameFn` | `ResolveFunctionNameFn?` | Custom name resolution (C/C++ declarators) |
| `extraWalkFn` | `ExtraWalkHandler?` | Custom AST walk (JS arrow functions, C# namespaces) |

## Tips

- **Start simple.** Get classes and functions working first, then add imports, then call graph.
- **Use the playground.** tree-sitter's online playground is invaluable for exploring grammars.
- **Check existing configs.** `python.ts` is the simplest, `c.ts` shows custom name resolution, `javascript.ts` shows `extraWalkFn`.
- **Call graph is INFERRED.** It's OK if call resolution isn't perfect — it's a best-effort pass.
