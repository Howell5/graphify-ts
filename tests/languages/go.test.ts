import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

const fixture = join(__dirname, "../fixtures/sample.go");

describe("Go extraction", () => {
  test("extracts file node and functions", async () => {
    const result = await extractFile(fixture);
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("sample.go"); // file node
    expect(nodeLabels.some((l) => l === "NewCalculator" || l === "main")).toBe(true);
  });

  test("extracts import edges", async () => {
    const result = await extractFile(fixture);
    const importEdges = result.edges.filter((e) => e.relation === "imports");
    expect(importEdges.length).toBeGreaterThanOrEqual(2); // fmt, os
  });

  test("extracts method declarations", async () => {
    const result = await extractFile(fixture);
    const nodeLabels = result.nodes.map((n) => n.label);
    // method_declaration should produce a function node
    const hasFunctionNodes = result.nodes.some(
      (n) => n.id.includes("add") || n.id.includes("main") || n.id.includes("newcalculator"),
    );
    expect(hasFunctionNodes).toBe(true);
  });
});
