import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

describe("C extraction", () => {
  test("extracts file node and functions from .c file", async () => {
    const fixture = join(__dirname, "../fixtures/sample.c");
    const result = await extractFile(fixture);
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("sample.c"); // file node
    const hasFunctions = result.nodes.some(
      (n) => n.id.includes("add") || n.id.includes("multiply") || n.id.includes("main"),
    );
    expect(hasFunctions).toBe(true);
  });

  test("extracts include import edges from .c file", async () => {
    const fixture = join(__dirname, "../fixtures/sample.c");
    const result = await extractFile(fixture);
    const importEdges = result.edges.filter((e) => e.relation === "imports");
    expect(importEdges.length).toBeGreaterThanOrEqual(2); // stdio, stdlib
  });
});

describe("C++ extraction", () => {
  test("extracts file node and class from .cpp file", async () => {
    const fixture = join(__dirname, "../fixtures/sample.cpp");
    const result = await extractFile(fixture);
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("sample.cpp");
    expect(nodeLabels).toContain("Calculator");
  });

  test("extracts include import edges from .cpp file", async () => {
    const fixture = join(__dirname, "../fixtures/sample.cpp");
    const result = await extractFile(fixture);
    const importEdges = result.edges.filter((e) => e.relation === "imports");
    expect(importEdges.length).toBeGreaterThanOrEqual(2); // iostream, vector
  });
});
