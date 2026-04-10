import { $ } from "bun";
import { join, resolve, extname } from "node:path";
import { existsSync } from "node:fs";
import { updateIndex } from "./index";
import { classifyFile, FileType } from "./detect";

export interface AutoUpdateResult {
  status: "no-index" | "no-git" | "no-changes" | "updated" | "error";
  changedFiles: string[];
  added: number;
  removed: number;
  error?: string;
}

/**
 * Compute changed code files via git and incrementally update the graph.
 *
 * Strategy:
 * 1. Check graphify-out/graph.json exists (skip if no index)
 * 2. Check we're in a git repo (skip if not)
 * 3. Collect changed files: git diff (tracked) + git ls-files --others --exclude-standard (untracked)
 * 4. Filter to code files only
 * 5. Call updateIndex with absolute paths
 */
export async function autoUpdate(projectDir: string): Promise<AutoUpdateResult> {
  const root = resolve(projectDir);
  const graphPath = join(root, "graphify-out", "graph.json");

  if (!existsSync(graphPath)) {
    return { status: "no-index", changedFiles: [], added: 0, removed: 0 };
  }

  // Check if we're in a git repo
  try {
    await $`git rev-parse --git-dir`.cwd(root).quiet();
  } catch {
    return { status: "no-git", changedFiles: [], added: 0, removed: 0 };
  }

  // Collect changed files: tracked modifications + untracked new files
  let tracked = "";
  let untracked = "";
  try {
    tracked = (await $`git diff --name-only HEAD`.cwd(root).quiet()).stdout.toString();
  } catch {
    // HEAD may not exist yet (fresh repo with no commits)
  }
  try {
    untracked = (await $`git ls-files --others --exclude-standard`.cwd(root).quiet()).stdout.toString();
  } catch {
    // Ignore — untracked listing is best-effort
  }

  const all = [
    ...tracked.split("\n").filter(Boolean),
    ...untracked.split("\n").filter(Boolean),
  ];

  // Dedupe and filter to code files
  const seen = new Set<string>();
  const codeFiles: string[] = [];
  for (const f of all) {
    if (seen.has(f)) continue;
    seen.add(f);
    const absolute = join(root, f);
    if (!existsSync(absolute)) continue; // deleted file
    if (classifyFile(f) !== FileType.Code) continue;
    codeFiles.push(f);
  }

  if (codeFiles.length === 0) {
    return { status: "no-changes", changedFiles: [], added: 0, removed: 0 };
  }

  try {
    const result = await updateIndex(
      graphPath,
      codeFiles.map((f) => join(root, f)),
    );
    return {
      status: "updated",
      changedFiles: codeFiles,
      added: result.added,
      removed: result.removed,
    };
  } catch (err) {
    return {
      status: "error",
      changedFiles: codeFiles,
      added: 0,
      removed: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
