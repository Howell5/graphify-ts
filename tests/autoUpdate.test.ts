import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { autoUpdate } from "../src/autoUpdate";
import { buildIndex } from "../src/index";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { $ } from "bun";

async function initGitRepo(dir: string): Promise<void> {
  await $`git init -q`.cwd(dir);
  await $`git config user.email test@test.com`.cwd(dir);
  await $`git config user.name test`.cwd(dir);
  await $`git add -A`.cwd(dir);
  await $`git commit -q -m initial`.cwd(dir);
}

describe("autoUpdate", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "graphify-auto-"));
    await mkdir(join(tempDir, "src"), { recursive: true });
    await writeFile(join(tempDir, "src", "main.py"), "def hello():\n    pass\n");
    await writeFile(join(tempDir, "src", "utils.py"), "def helper():\n    pass\n");
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("returns 'no index' status when graph.json does not exist", async () => {
    await initGitRepo(tempDir);
    const result = await autoUpdate(tempDir);
    expect(result.status).toBe("no-index");
  });

  test("returns 'no git' status when directory is not a git repo", async () => {
    const outputDir = join(tempDir, "graphify-out");
    await buildIndex(join(tempDir, "src"), { outputDir });
    const result = await autoUpdate(tempDir);
    expect(result.status).toBe("no-git");
  });

  test("returns 'no changes' when git has no modifications", async () => {
    const outputDir = join(tempDir, "graphify-out");
    await buildIndex(join(tempDir, "src"), { outputDir });
    await initGitRepo(tempDir);
    const result = await autoUpdate(tempDir);
    expect(result.status).toBe("no-changes");
  });

  test("updates index when code files are modified", async () => {
    const outputDir = join(tempDir, "graphify-out");
    await buildIndex(join(tempDir, "src"), { outputDir });
    await initGitRepo(tempDir);

    // Modify a file
    await writeFile(
      join(tempDir, "src", "main.py"),
      "def hello():\n    pass\n\ndef new_func():\n    return 42\n",
    );

    const result = await autoUpdate(tempDir);
    expect(result.status).toBe("updated");
    expect(result.changedFiles).toContain("src/main.py");
    expect(result.added).toBeGreaterThan(0);
  });

  test("filters out non-code files", async () => {
    const outputDir = join(tempDir, "graphify-out");
    await buildIndex(join(tempDir, "src"), { outputDir });
    await initGitRepo(tempDir);

    // Modify a non-code file
    await writeFile(join(tempDir, "README.md"), "# Changed");

    const result = await autoUpdate(tempDir);
    expect(result.status).toBe("no-changes");
  });

  test("handles new untracked code files", async () => {
    const outputDir = join(tempDir, "graphify-out");
    await buildIndex(join(tempDir, "src"), { outputDir });
    await initGitRepo(tempDir);

    // Add a new file
    await writeFile(
      join(tempDir, "src", "new_module.py"),
      "def brand_new():\n    pass\n",
    );

    const result = await autoUpdate(tempDir);
    expect(result.status).toBe("updated");
    expect(result.changedFiles.some((f) => f.endsWith("new_module.py"))).toBe(true);
  });
});
