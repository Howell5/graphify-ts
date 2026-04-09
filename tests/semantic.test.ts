import { describe, test, expect } from "bun:test";
import { labelNodes, type SemanticLabeler } from "../src/semantic";
import { buildGraph } from "../src/graph";
import type { ExtractionResult } from "../src/languages/types";

describe("semantic labeling", () => {
  const extraction: ExtractionResult = {
    nodes: [
      { id: "file::auth", label: "auth.py", fileType: "code", sourceFile: "auth.py", sourceLocation: "auth.py:1" },
      { id: "auth::login", label: "login", fileType: "code", sourceFile: "auth.py", sourceLocation: "auth.py:5" },
      { id: "auth::hash_password", label: "hash_password", fileType: "code", sourceFile: "auth.py", sourceLocation: "auth.py:20" },
    ],
    edges: [
      { source: "file::auth", target: "auth::login", relation: "contains", confidence: "EXTRACTED", sourceFile: "auth.py", sourceLocation: "auth.py:5", weight: 1.0 },
      { source: "file::auth", target: "auth::hash_password", relation: "contains", confidence: "EXTRACTED", sourceFile: "auth.py", sourceLocation: "auth.py:20", weight: 1.0 },
    ],
  };

  test("labelNodes assigns semantic labels via provided labeler", async () => {
    const mockLabeler: SemanticLabeler = async (nodes) => {
      const labelMap = new Map<string, string[]>();
      for (const n of nodes) {
        if (n.label.includes("login")) labelMap.set(n.id, ["authentication", "user-session"]);
        if (n.label.includes("hash")) labelMap.set(n.id, ["security", "cryptography"]);
      }
      return labelMap;
    };

    const g = buildGraph(extraction);
    await labelNodes(g, mockLabeler);

    const loginAttrs = g.getNodeAttributes("auth::login");
    expect(loginAttrs.semanticLabels).toContain("authentication");

    const hashAttrs = g.getNodeAttributes("auth::hash_password");
    expect(hashAttrs.semanticLabels).toContain("security");
  });

  test("labelNodes skips file-level nodes", async () => {
    const passedNodes: string[] = [];
    const labeler: SemanticLabeler = async (nodes) => {
      for (const n of nodes) passedNodes.push(n.id);
      return new Map(nodes.map((n) => [n.id, ["labeled"]]));
    };

    const g = buildGraph(extraction);
    await labelNodes(g, labeler);
    // file::auth should NOT be passed to labeler (it's a file node)
    expect(passedNodes).not.toContain("file::auth");
  });

  test("labelNodes skips already-labeled nodes when skipLabeled is true", async () => {
    const passedNodes: string[] = [];
    const labeler: SemanticLabeler = async (nodes) => {
      for (const n of nodes) passedNodes.push(n.id);
      return new Map(nodes.map((n) => [n.id, ["new-label"]]));
    };

    const g = buildGraph(extraction);
    g.setNodeAttribute("auth::login", "semanticLabels", ["already-labeled"]);

    await labelNodes(g, labeler, { skipLabeled: true });
    expect(passedNodes).not.toContain("auth::login");
    // Original label preserved
    expect(g.getNodeAttributes("auth::login").semanticLabels).toEqual(["already-labeled"]);
  });
});
