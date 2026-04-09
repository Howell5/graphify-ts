import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

const fixture = join(__dirname, "../fixtures/sample.scala");

describe("Scala extraction", () => {
  test("extracts file node and class", async () => {
    const result = await extractFile(fixture);
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("sample.scala"); // file node
    expect(nodeLabels).toContain("Calculator"); // class
  });

  test("extracts import edges", async () => {
    const result = await extractFile(fixture);
    const importEdges = result.edges.filter((e) => e.relation === "imports");
    expect(importEdges.length).toBeGreaterThanOrEqual(1);
  });

  test("extracts object definition and methods", async () => {
    const result = await extractFile(fixture);
    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("Main"); // object definition
  });
});
