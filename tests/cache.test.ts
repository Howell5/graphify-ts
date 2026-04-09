import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { fileHash, loadCached, saveCached, clearCache } from "../src/cache";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("cache", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "graphify-cache-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("fileHash returns consistent hash for same content", async () => {
    const filePath = join(tempDir, "test.py");
    await writeFile(filePath, "print('hello')");
    const h1 = await fileHash(filePath);
    const h2 = await fileHash(filePath);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // SHA256 hex
  });

  test("fileHash changes when content changes", async () => {
    const filePath = join(tempDir, "test.py");
    await writeFile(filePath, "print('hello')");
    const h1 = await fileHash(filePath);
    await writeFile(filePath, "print('world')");
    const h2 = await fileHash(filePath);
    expect(h1).not.toBe(h2);
  });

  test("loadCached returns null for uncached file", async () => {
    const filePath = join(tempDir, "test.py");
    await writeFile(filePath, "print('hello')");
    const result = await loadCached(filePath, tempDir);
    expect(result).toBeNull();
  });

  test("saveCached + loadCached roundtrip", async () => {
    const filePath = join(tempDir, "test.py");
    await writeFile(filePath, "print('hello')");
    const data = { nodes: [{ id: "test", label: "test" }], edges: [] };
    await saveCached(filePath, data, tempDir);
    const loaded = await loadCached(filePath, tempDir);
    expect(loaded).toEqual(data);
  });

  test("loadCached returns null after file content changes", async () => {
    const filePath = join(tempDir, "test.py");
    await writeFile(filePath, "print('hello')");
    await saveCached(filePath, { nodes: [], edges: [] }, tempDir);
    await writeFile(filePath, "print('changed')");
    const loaded = await loadCached(filePath, tempDir);
    expect(loaded).toBeNull();
  });

  test("clearCache removes all cached entries", async () => {
    const filePath = join(tempDir, "test.py");
    await writeFile(filePath, "print('hello')");
    await saveCached(filePath, { nodes: [], edges: [] }, tempDir);
    await clearCache(tempDir);
    const loaded = await loadCached(filePath, tempDir);
    expect(loaded).toBeNull();
  });
});
