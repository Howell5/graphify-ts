import type { LanguageConfig } from "./types";

const configRegistry = new Map<string, () => Promise<LanguageConfig>>();

const extensionMap = new Map<string, string>([
  [".py", "python"],
  [".js", "javascript"],
  [".jsx", "javascript"],
  [".ts", "typescript"],
  [".tsx", "typescript"],
  [".go", "go"],
  [".rs", "rust"],
  [".java", "java"],
  [".c", "c"],
  [".h", "c"],
  [".cpp", "cpp"],
  [".cc", "cpp"],
  [".cxx", "cpp"],
  [".hpp", "cpp"],
  [".rb", "ruby"],
  [".cs", "csharp"],
  [".kt", "kotlin"],
  [".kts", "kotlin"],
  [".scala", "scala"],
  [".php", "php"],
]);

export function registerLanguage(
  key: string,
  loader: () => Promise<LanguageConfig>,
): void {
  configRegistry.set(key, loader);
}

export function getLanguageKey(ext: string): string | null {
  return extensionMap.get(ext.toLowerCase()) ?? null;
}

export async function getLanguageConfig(
  key: string,
): Promise<LanguageConfig | null> {
  const loader = configRegistry.get(key);
  if (!loader) return null;
  return loader();
}

export function supportedExtensions(): string[] {
  return [...extensionMap.keys()];
}

// Register languages (only python for now, others will be added in Tasks 6-7)
registerLanguage("python", () => import("./python").then((m) => m.config));

export type {
  LanguageConfig,
  NodeDict,
  EdgeDict,
  ExtractionResult,
} from "./types";
