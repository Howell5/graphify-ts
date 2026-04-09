import { describe, test, expect } from "bun:test";
import { graphDiff } from "../src/diff";
import { buildGraph } from "../src/graph";
import type { ExtractionResult } from "../src/languages/types";

describe("graphDiff", () => {
  test("detects added nodes and edges", () => {
    const old: ExtractionResult = {
      nodes: [{ id: "a", label: "A", fileType: "code", sourceFile: "a.py", sourceLocation: "a.py:1" }],
      edges: [],
    };
    const newExt: ExtractionResult = {
      nodes: [
        { id: "a", label: "A", fileType: "code", sourceFile: "a.py", sourceLocation: "a.py:1" },
        { id: "b", label: "B", fileType: "code", sourceFile: "b.py", sourceLocation: "b.py:1" },
      ],
      edges: [{ source: "a", target: "b", relation: "imports", confidence: "EXTRACTED", sourceFile: "a.py", sourceLocation: "a.py:2", weight: 1.0 }],
    };

    const diff = graphDiff(buildGraph(old), buildGraph(newExt));
    expect(diff.newNodes).toHaveLength(1);
    expect(diff.newNodes[0].id).toBe("b");
    expect(diff.newEdges).toHaveLength(1);
    expect(diff.removedNodes).toHaveLength(0);
  });

  test("detects removed nodes", () => {
    const old: ExtractionResult = {
      nodes: [
        { id: "a", label: "A", fileType: "code", sourceFile: "a.py", sourceLocation: "a.py:1" },
        { id: "b", label: "B", fileType: "code", sourceFile: "b.py", sourceLocation: "b.py:1" },
      ],
      edges: [],
    };
    const newExt: ExtractionResult = {
      nodes: [{ id: "a", label: "A", fileType: "code", sourceFile: "a.py", sourceLocation: "a.py:1" }],
      edges: [],
    };

    const diff = graphDiff(buildGraph(old), buildGraph(newExt));
    expect(diff.removedNodes).toHaveLength(1);
    expect(diff.removedNodes[0].id).toBe("b");
  });

  test("returns 'no changes' for identical graphs", () => {
    const ext: ExtractionResult = {
      nodes: [{ id: "a", label: "A", fileType: "code", sourceFile: "a.py", sourceLocation: "a.py:1" }],
      edges: [],
    };
    const diff = graphDiff(buildGraph(ext), buildGraph(ext));
    expect(diff.summary).toBe("no changes");
  });
});
