import type Graph from "graphology";

// Common file extensions used to detect file-level nodes
const FILE_EXTENSIONS = new Set([
  ".py", ".ts", ".js", ".tsx", ".jsx", ".rs", ".go", ".java", ".rb",
  ".c", ".cpp", ".h", ".hpp", ".cs", ".swift", ".kt", ".jl", ".php",
  ".lua", ".r", ".m", ".ex", ".exs", ".hs", ".ml", ".mli", ".scala",
]);

export interface NodeSummary {
  id: string;
  label: string;
  sourceFile: string;
  neighbors: string[];
}

export interface SemanticLabeler {
  (nodes: NodeSummary[]): Promise<Map<string, string[]>>;
}

export interface LabelNodesOptions {
  /** Skip nodes that already have semanticLabels set. Default: false. */
  skipLabeled?: boolean;
  /** Max nodes to send per labeler batch. Default: 50. */
  batchSize?: number;
}

/**
 * Returns true if the label looks like a file-level node
 * (e.g. "auth.py", "utils.ts").
 */
function isFileNode(label: string): boolean {
  const lastDot = label.lastIndexOf(".");
  if (lastDot === -1) return false;
  const ext = label.slice(lastDot).toLowerCase();
  return FILE_EXTENSIONS.has(ext);
}

/**
 * Filter nodes, call the labeler in batches, and set semanticLabels on each node.
 */
export async function labelNodes(
  graph: Graph,
  labeler: SemanticLabeler,
  options: LabelNodesOptions = {},
): Promise<void> {
  const { skipLabeled = false, batchSize = 50 } = options;

  // Collect candidate nodes
  const candidates: NodeSummary[] = [];

  graph.forEachNode((nodeId, attrs) => {
    // Skip file-level nodes
    if (isFileNode(attrs.label as string)) return;

    // Skip already-labeled nodes when requested
    if (skipLabeled && attrs.semanticLabels != null) return;

    const neighbors = graph.neighbors(nodeId).map((nbId) => {
      const nbAttrs = graph.getNodeAttributes(nbId);
      return (nbAttrs.label as string) ?? nbId;
    });

    candidates.push({
      id: nodeId,
      label: attrs.label as string,
      sourceFile: attrs.sourceFile as string,
      neighbors,
    });
  });

  // Process in batches
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const labelMap = await labeler(batch);

    for (const [nodeId, labels] of labelMap) {
      if (graph.hasNode(nodeId)) {
        graph.setNodeAttribute(nodeId, "semanticLabels", labels);
      }
    }
  }
}

/**
 * Factory that creates a SemanticLabeler backed by the Claude API.
 * Dynamically imports @anthropic-ai/sdk to avoid hard dependency at module load.
 */
export function createClaudeLabeler(apiKey?: string): SemanticLabeler {
  return async (nodes: NodeSummary[]): Promise<Map<string, string[]>> => {
    // Dynamic import so the module is optional at runtime
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const nodeList = nodes
      .map((n) => `- id: "${n.id}", label: "${n.label}", file: "${n.sourceFile}", neighbors: [${n.neighbors.map((nb) => `"${nb}"`).join(", ")}]`)
      .join("\n");

    const prompt = `You are a code analyst. For each code symbol below, assign 1-3 short domain labels
(e.g. "authentication", "database", "api", "security", "cryptography", "logging", etc.).

Symbols:
${nodeList}

Respond ONLY with a JSON object mapping each id to an array of label strings.
Example: {"auth::login": ["authentication", "user-session"]}`;

    const message = await client.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    // Extract the JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return new Map();

    const parsed: Record<string, string[]> = JSON.parse(jsonMatch[0]);
    return new Map(Object.entries(parsed));
  };
}
