import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { buildIndex, query, updateIndex } from "../src/index";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("public API", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "graphify-api-"));
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(
      join(tempDir, "src", "main.py"),
      `
class App:
    def run(self):
        pass

def setup():
    app = App()
    app.run()
`,
    );
    await writeFile(
      join(tempDir, "src", "utils.py"),
      `
def helper(x):
    return x * 2
`,
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("buildIndex creates index with correct structure", async () => {
    const index = await buildIndex(join(tempDir, "src"));
    expect(index.metadata.files).toBe(2);
    expect(index.nodes.length).toBeGreaterThan(0);
    expect(index.edges.length).toBeGreaterThan(0);
    expect(index.metadata.builtAt).toBeTruthy();
  });

  test("buildIndex saves graph.json to output dir", async () => {
    const outputDir = join(tempDir, "graphify-out");
    await buildIndex(join(tempDir, "src"), { outputDir });
    const graphFile = Bun.file(join(outputDir, "graph.json"));
    expect(await graphFile.exists()).toBe(true);
    const data = await graphFile.json();
    expect(data.nodes.length).toBeGreaterThan(0);
  });

  test("query finds symbols by name", async () => {
    const outputDir = join(tempDir, "graphify-out");
    await buildIndex(join(tempDir, "src"), { outputDir });
    const results = await query(join(outputDir, "graph.json"), "App");
    expect(results.length).toBeGreaterThan(0);
  });

  test("updateIndex detects file changes", async () => {
    const outputDir = join(tempDir, "graphify-out");
    await buildIndex(join(tempDir, "src"), { outputDir });

    // Add a new file
    const newFile = join(tempDir, "src", "new_module.py");
    await writeFile(newFile, "def new_func():\n    pass\n");

    const result = await updateIndex(join(outputDir, "graph.json"), [newFile]);
    expect(result.added).toBeGreaterThan(0);
  });
});
