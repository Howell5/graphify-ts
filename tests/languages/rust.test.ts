import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

const fixture = join(__dirname, "../fixtures/sample.rs");

describe("Rust extraction", () => {
  test("extracts file node and structs", async () => {
    const result = await extractFile(fixture);
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("sample.rs"); // file node
    expect(nodeLabels).toContain("Calculator"); // struct
  });

  test("extracts import edges from use declarations", async () => {
    const result = await extractFile(fixture);
    const importEdges = result.edges.filter((e) => e.relation === "imports");
    expect(importEdges.length).toBeGreaterThanOrEqual(1);
  });

  test("extracts function items", async () => {
    const result = await extractFile(fixture);
    const containsEdges = result.edges.filter((e) => e.relation === "contains");
    expect(containsEdges.length).toBeGreaterThanOrEqual(1);
  });
});
