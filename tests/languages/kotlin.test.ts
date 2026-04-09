import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

const fixture = join(__dirname, "../fixtures/sample.kt");

describe("Kotlin extraction", () => {
  test("extracts file node and class", async () => {
    const result = await extractFile(fixture);
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("sample.kt"); // file node
    expect(nodeLabels).toContain("Calculator"); // class
  });

  test("extracts import edges", async () => {
    const result = await extractFile(fixture);
    const importEdges = result.edges.filter((e) => e.relation === "imports");
    expect(importEdges.length).toBeGreaterThanOrEqual(1);
  });

  test("extracts functions and methods", async () => {
    const result = await extractFile(fixture);
    const hasFunction = result.nodes.some(
      (n) => n.id.includes("add") || n.id.includes("main") || n.id.includes("subtract"),
    );
    expect(hasFunction).toBe(true);
  });
});
