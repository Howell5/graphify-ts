import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { installHook, uninstallHook, hookStatus } from "../src/hook";
import { mkdtemp, rm, writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("hook installer", () => {
  let tempDir: string;
  let settingsPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "graphify-hook-"));
    settingsPath = join(tempDir, "settings.json");
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("installHook creates settings.json if it doesn't exist", async () => {
    await installHook(settingsPath);
    const content = await readFile(settingsPath, "utf-8");
    const data = JSON.parse(content);
    expect(data.hooks).toBeDefined();
    expect(data.hooks.Stop).toBeDefined();
  });

  test("installHook adds Stop hook with graphify marker", async () => {
    await installHook(settingsPath);
    const data = JSON.parse(await readFile(settingsPath, "utf-8"));
    const stopHooks = data.hooks.Stop;
    expect(Array.isArray(stopHooks)).toBe(true);
    // Should have at least one matcher entry that contains a hook with graphify auto-update
    const hasGraphifyHook = stopHooks.some((entry: any) =>
      entry.hooks?.some((h: any) => h.command?.includes("graphify auto-update"))
    );
    expect(hasGraphifyHook).toBe(true);
  });

  test("installHook preserves existing settings and hooks", async () => {
    const existing = {
      theme: "dark",
      hooks: {
        PreToolUse: [
          { matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] },
        ],
      },
    };
    await writeFile(settingsPath, JSON.stringify(existing, null, 2));

    await installHook(settingsPath);

    const data = JSON.parse(await readFile(settingsPath, "utf-8"));
    expect(data.theme).toBe("dark");
    expect(data.hooks.PreToolUse).toBeDefined();
    expect(data.hooks.PreToolUse[0].hooks[0].command).toBe("echo hi");
    expect(data.hooks.Stop).toBeDefined();
  });

  test("installHook is idempotent (running twice doesn't duplicate)", async () => {
    await installHook(settingsPath);
    await installHook(settingsPath);
    const data = JSON.parse(await readFile(settingsPath, "utf-8"));
    const graphifyCount = JSON.stringify(data).match(/graphify auto-update/g)?.length ?? 0;
    expect(graphifyCount).toBe(1);
  });

  test("uninstallHook removes the graphify hook", async () => {
    await installHook(settingsPath);
    await uninstallHook(settingsPath);
    const data = JSON.parse(await readFile(settingsPath, "utf-8"));
    const stopHooks = data.hooks?.Stop ?? [];
    const stillHasGraphify = stopHooks.some((entry: any) =>
      entry.hooks?.some((h: any) => h.command?.includes("graphify auto-update"))
    );
    expect(stillHasGraphify).toBe(false);
  });

  test("uninstallHook preserves other Stop hooks", async () => {
    const existing = {
      hooks: {
        Stop: [
          { matcher: "*", hooks: [{ type: "command", command: "echo stopping" }] },
        ],
      },
    };
    await writeFile(settingsPath, JSON.stringify(existing, null, 2));
    await installHook(settingsPath);
    await uninstallHook(settingsPath);

    const data = JSON.parse(await readFile(settingsPath, "utf-8"));
    const hasOther = data.hooks.Stop.some((entry: any) =>
      entry.hooks?.some((h: any) => h.command === "echo stopping")
    );
    expect(hasOther).toBe(true);
  });

  test("hookStatus reports installed state", async () => {
    expect(await hookStatus(settingsPath)).toBe("not-installed");
    await installHook(settingsPath);
    expect(await hookStatus(settingsPath)).toBe("installed");
    await uninstallHook(settingsPath);
    expect(await hookStatus(settingsPath)).toBe("not-installed");
  });
});
