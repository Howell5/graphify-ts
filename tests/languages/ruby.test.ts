import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

const fixture = join(__dirname, "../fixtures/sample.rb");

describe("Ruby extraction", () => {
  test("extracts file node and class", async () => {
    const result = await extractFile(fixture);
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("sample.rb"); // file node
    expect(nodeLabels).toContain("Calculator"); // class
  });

  test("extracts methods", async () => {
    const result = await extractFile(fixture);
    const methodEdges = result.edges.filter((e) => e.relation === "method");
    expect(methodEdges.length).toBeGreaterThanOrEqual(2); // add, subtract (initialize too)
  });

  test("file node has contains edge to class", async () => {
    const result = await extractFile(fixture);
    const containsEdges = result.edges.filter((e) => e.relation === "contains");
    expect(containsEdges.length).toBeGreaterThanOrEqual(1);
  });
});
