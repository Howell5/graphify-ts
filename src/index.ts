export interface GraphifyIndex {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: { files: number; nodes: number; edges: number; builtAt: string };
}

export interface GraphNode {
  id: string;
  label: string;
  fileType: "code" | "document" | "rationale";
  sourceFile: string;
  sourceLocation: string;
  semanticLabels?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: "imports" | "imports_from" | "contains" | "method" | "calls" | "inherits" | "rationale_for";
  confidence: "EXTRACTED" | "INFERRED";
  sourceFile: string;
  sourceLocation: string;
  weight: number;
}

export async function buildIndex(dir: string): Promise<GraphifyIndex> {
  throw new Error("Not implemented");
}

export async function query(graphPath: string, question: string): Promise<GraphNode[]> {
  throw new Error("Not implemented");
}

export async function updateIndex(graphPath: string, changedFiles: string[]): Promise<{ added: number; removed: number; updated: number }> {
  throw new Error("Not implemented");
}
