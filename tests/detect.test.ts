import { describe, test, expect } from "bun:test";
import { classifyFile, collectFiles, FileType } from "../src/detect";

describe("classifyFile", () => {
  test("classifies .py as code", () => {
    expect(classifyFile("main.py")).toBe(FileType.Code);
  });

  test("classifies .ts as code", () => {
    expect(classifyFile("index.ts")).toBe(FileType.Code);
  });

  test("classifies .md as document", () => {
    expect(classifyFile("README.md")).toBe(FileType.Document);
  });

  test("classifies .pdf as paper", () => {
    expect(classifyFile("attention.pdf")).toBe(FileType.Paper);
  });

  test("classifies .png as image", () => {
    expect(classifyFile("diagram.png")).toBe(FileType.Image);
  });

  test("returns null for unknown extension", () => {
    expect(classifyFile("data.xyz")).toBeNull();
  });

  test("skips sensitive files", () => {
    expect(classifyFile(".env")).toBeNull();
    expect(classifyFile("credentials.json")).toBeNull();
    expect(classifyFile("id_rsa")).toBeNull();
    expect(classifyFile("secret.pem")).toBeNull();
  });
});

describe("collectFiles", () => {
  test("collects files from a directory", async () => {
    const files = await collectFiles("tests/fixtures");
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.type !== null)).toBe(true);
  });
});
