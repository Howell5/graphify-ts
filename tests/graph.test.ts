import { describe, test, expect } from "bun:test";
import { buildGraph, serializeGraph, deserializeGraph, mergeExtractions } from "../src/graph";
import type { ExtractionResult } from "../src/languages/types";

describe("graph", () => {
  const extraction: ExtractionResult = {
    nodes: [
      { id: "main", label: "main.py", fileType: "code", sourceFile: "main.py", sourceLocation: "main.py:1" },
      { id: "main::calculator", label: "Calculator", fileType: "code", sourceFile: "main.py", sourceLocation: "main.py:3" },
    ],
    edges: [
      { source: "main", target: "main::calculator", relation: "contains", confidence: "EXTRACTED", sourceFile: "main.py", sourceLocation: "main.py:3", weight: 1.0 },
    ],
  };

  test("buildGraph creates graph with correct node/edge counts", () => {
    const g = buildGraph(extraction);
    expect(g.order).toBe(2);
    expect(g.size).toBe(1);
  });

  test("buildGraph preserves node attributes", () => {
    const g = buildGraph(extraction);
    const attrs = g.getNodeAttributes("main::calculator");
    expect(attrs.label).toBe("Calculator");
    expect(attrs.sourceFile).toBe("main.py");
  });

  test("serialize and deserialize roundtrip", () => {
    const g = buildGraph(extraction);
    const json = serializeGraph(g);
    const g2 = deserializeGraph(json);
    expect(g2.order).toBe(g.order);
    expect(g2.size).toBe(g.size);
  });

  test("mergeExtractions combines multiple results", () => {
    const ext1: ExtractionResult = {
      nodes: [{ id: "a", label: "A", fileType: "code", sourceFile: "a.py", sourceLocation: "a.py:1" }],
      edges: [],
    };
    const ext2: ExtractionResult = {
      nodes: [{ id: "b", label: "B", fileType: "code", sourceFile: "b.py", sourceLocation: "b.py:1" }],
      edges: [{ source: "a", target: "b", relation: "imports", confidence: "EXTRACTED", sourceFile: "a.py", sourceLocation: "a.py:2", weight: 1.0 }],
    };
    const g = mergeExtractions([ext1, ext2]);
    expect(g.order).toBe(2);
    expect(g.size).toBe(1);
  });

  test("duplicate node IDs are deduplicated (last wins)", () => {
    const ext: ExtractionResult = {
      nodes: [
        { id: "x", label: "X-old", fileType: "code", sourceFile: "a.py", sourceLocation: "a.py:1" },
        { id: "x", label: "X-new", fileType: "code", sourceFile: "b.py", sourceLocation: "b.py:5" },
      ],
      edges: [],
    };
    const g = buildGraph(ext);
    expect(g.order).toBe(1);
    expect(g.getNodeAttributes("x").label).toBe("X-new");
  });
});
