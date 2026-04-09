import { describe, test, expect } from "bun:test";
import { extractFile } from "../../src/extract";
import { join } from "node:path";

const fixturesDir = join(__dirname, "../fixtures");

describe("JavaScript/TypeScript extraction", () => {
  test("extracts class and methods from .ts file", async () => {
    await Bun.write(join(fixturesDir, "sample_class.ts"), `
export class UserService {
  constructor(private db: Database) {}

  async getUser(id: string): Promise<User> {
    return this.db.findById(id);
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.remove(id);
  }
}
`);
    const result = await extractFile(join(fixturesDir, "sample_class.ts"));
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("UserService");

    const methodEdges = result.edges.filter((e) => e.relation === "method");
    expect(methodEdges.length).toBeGreaterThanOrEqual(2);
  });

  test("extracts arrow functions", async () => {
    await Bun.write(join(fixturesDir, "sample_arrow.js"), `
const fetchData = async (url) => {
  const response = await fetch(url);
  return response.json();
};

const processItem = (item) => {
  return transform(item);
};
`);
    const result = await extractFile(join(fixturesDir, "sample_arrow.js"));
    expect(result.error).toBeUndefined();

    const nodeLabels = result.nodes.map((n) => n.label);
    expect(nodeLabels).toContain("fetchData");
    expect(nodeLabels).toContain("processItem");
  });

  test("extracts import statements", async () => {
    await Bun.write(join(fixturesDir, "sample_import.js"), `
import { readFile } from 'node:fs/promises';
import path from 'path';
`);
    const result = await extractFile(join(fixturesDir, "sample_import.js"));
    const importEdges = result.edges.filter((e) => e.relation === "imports" || e.relation === "imports_from");
    expect(importEdges.length).toBe(2);
  });
});
