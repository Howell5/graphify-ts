import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

const fixture = join(__dirname, "../fixtures/sample.java");

describe("Java extraction", () => {
  test("extracts file node and class", async () => {
    const result = await extractFile(fixture);
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("sample.java"); // file node
    expect(nodeLabels).toContain("Calculator"); // class
  });

  test("extracts import edges", async () => {
    const result = await extractFile(fixture);
    const importEdges = result.edges.filter((e) => e.relation === "imports");
    expect(importEdges.length).toBeGreaterThanOrEqual(2); // List, ArrayList
  });

  test("extracts methods", async () => {
    const result = await extractFile(fixture);
    const methodEdges = result.edges.filter((e) => e.relation === "method");
    expect(methodEdges.length).toBeGreaterThanOrEqual(2); // add, main (constructor too)
  });
});
