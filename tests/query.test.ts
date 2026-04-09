import { describe, test, expect } from "bun:test";
import { findSymbol, callersOf, calleesOf, fileSymbols, shortestPath } from "../src/query";
import { buildGraph } from "../src/graph";
import type { ExtractionResult } from "../src/languages/types";

const extraction: ExtractionResult = {
  nodes: [
    { id: "file::main", label: "main.py", fileType: "code", sourceFile: "main.py", sourceLocation: "main.py:1" },
    { id: "main::app", label: "App", fileType: "code", sourceFile: "main.py", sourceLocation: "main.py:5" },
    { id: "main::app::run", label: ".run", fileType: "code", sourceFile: "main.py", sourceLocation: "main.py:10" },
    { id: "main::setup", label: "setup", fileType: "code", sourceFile: "main.py", sourceLocation: "main.py:20" },
    { id: "file::utils", label: "utils.py", fileType: "code", sourceFile: "utils.py", sourceLocation: "utils.py:1" },
    { id: "utils::helper", label: "helper", fileType: "code", sourceFile: "utils.py", sourceLocation: "utils.py:3" },
  ],
  edges: [
    { source: "file::main", target: "main::app", relation: "contains", confidence: "EXTRACTED", sourceFile: "main.py", sourceLocation: "main.py:5", weight: 1.0 },
    { source: "main::app", target: "main::app::run", relation: "method", confidence: "EXTRACTED", sourceFile: "main.py", sourceLocation: "main.py:10", weight: 1.0 },
    { source: "file::main", target: "main::setup", relation: "contains", confidence: "EXTRACTED", sourceFile: "main.py", sourceLocation: "main.py:20", weight: 1.0 },
    { source: "main::setup", target: "utils::helper", relation: "calls", confidence: "INFERRED", sourceFile: "main.py", sourceLocation: "main.py:22", weight: 0.8 },
    { source: "file::utils", target: "utils::helper", relation: "contains", confidence: "EXTRACTED", sourceFile: "utils.py", sourceLocation: "utils.py:3", weight: 1.0 },
  ],
};

describe("query", () => {
  const g = buildGraph(extraction);

  test("findSymbol returns matching nodes", () => {
    const results = findSymbol(g, "App");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("main::app");
  });

  test("findSymbol is case-insensitive", () => {
    const results = findSymbol(g, "app");
    expect(results.length).toBe(1);
  });

  test("findSymbol returns empty for no match", () => {
    expect(findSymbol(g, "nonexistent")).toHaveLength(0);
  });

  test("calleesOf returns functions called by a node", () => {
    const results = calleesOf(g, "main::setup");
    expect(results.map((r) => r.id)).toContain("utils::helper");
  });

  test("callersOf returns functions that call a node", () => {
    const results = callersOf(g, "utils::helper");
    expect(results.map((r) => r.id)).toContain("main::setup");
  });

  test("fileSymbols returns all symbols in a file", () => {
    const results = fileSymbols(g, "main.py");
    expect(results.length).toBeGreaterThanOrEqual(3);
  });

  test("shortestPath finds connection between nodes", () => {
    const path = shortestPath(g, "main::app::run", "utils::helper");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });
});
