import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

describe("Python extraction", () => {
  test("extracts class and methods from sample.py", async () => {
    const result = await extractFile(join(__dirname, "../fixtures/sample.py"));
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("sample.py"); // file node
    expect(nodeLabels).toContain("Calculator"); // class

    const methodNodes = result.nodes.filter((n) => n.label.startsWith("."));
    expect(methodNodes.length).toBeGreaterThanOrEqual(2); // .add(), .subtract()

    const containsEdges = result.edges.filter(
      (e) => e.relation === "contains",
    );
    expect(containsEdges.length).toBeGreaterThanOrEqual(1);

    const methodEdges = result.edges.filter((e) => e.relation === "method");
    expect(methodEdges.length).toBeGreaterThanOrEqual(2);
  });

  test("extracts imports", async () => {
    const fixture = join(__dirname, "../fixtures/sample_imports.py");
    await Bun.write(
      fixture,
      "import os\nfrom pathlib import Path\nimport json\n",
    );
    const result = await extractFile(fixture);
    const importEdges = result.edges.filter(
      (e) => e.relation === "imports" || e.relation === "imports_from",
    );
    expect(importEdges.length).toBe(3);
  });

  test("extracts inheritance", async () => {
    const fixture = join(__dirname, "../fixtures/sample_inherit.py");
    await Bun.write(
      fixture,
      "class Animal:\n    pass\n\nclass Dog(Animal):\n    pass\n",
    );
    const result = await extractFile(fixture);
    const inheritEdges = result.edges.filter(
      (e) => e.relation === "inherits",
    );
    expect(inheritEdges.length).toBe(1);
  });
});
