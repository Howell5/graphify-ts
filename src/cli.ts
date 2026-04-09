#!/usr/bin/env bun
import { buildIndex, query, updateIndex } from "./index";
import { resolve, join } from "node:path";

const args = process.argv.slice(2);
const command = args[0];

function usage(): void {
  console.log(`graphify — Code navigation for AI agents

Usage:
  graphify build [dir]                    Build index for a directory (default: .)
  graphify query <graph.json> <name>      Search for symbols by name
  graphify update <graph.json> <files...> Incrementally update after edits
  graphify help                           Show this help

Output:
  graphify-out/graph.json                 The knowledge graph
`);
}

async function main(): Promise<void> {
  if (!command || command === "help" || command === "--help") {
    usage();
    process.exit(0);
  }

  if (command === "build") {
    const dir = resolve(args[1] ?? ".");
    const outputDir = join(dir, "graphify-out");
    console.log(`Scanning ${dir}...`);
    const index = await buildIndex(dir, { outputDir });
    console.log(`Indexed ${index.metadata.files} files, ${index.metadata.nodes} symbols, ${index.metadata.edges} relationships`);
    console.log(`Saved to ${outputDir}/graph.json`);
    return;
  }

  if (command === "query") {
    const graphPath = args[1];
    const name = args[2];
    if (!graphPath || !name) {
      console.error("Usage: graphify query <graph.json> <name>");
      process.exit(1);
    }
    const results = await query(resolve(graphPath), name);
    if (results.length === 0) {
      console.log(`No symbols matching "${name}"`);
    } else {
      for (const r of results) {
        console.log(`${r.label} → ${r.sourceLocation}`);
      }
    }
    return;
  }

  if (command === "update") {
    const graphPath = args[1];
    const files = args.slice(2);
    if (!graphPath || files.length === 0) {
      console.error("Usage: graphify update <graph.json> <file1> [file2...]");
      process.exit(1);
    }
    const result = await updateIndex(resolve(graphPath), files.map(resolve));
    console.log(`Updated: +${result.added} nodes, -${result.removed} nodes, ${result.updated} files re-extracted`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  usage();
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
