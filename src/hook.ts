import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const GRAPHIFY_MARKER = "graphify auto-update";

export interface StopHookEntry {
  matcher?: string;
  hooks: Array<{ type: string; command: string }>;
}

export interface ClaudeSettings {
  hooks?: {
    Stop?: StopHookEntry[];
    [key: string]: StopHookEntry[] | undefined;
  };
  [key: string]: unknown;
}

export function defaultSettingsPath(): string {
  return join(homedir(), ".claude", "settings.json");
}

async function readSettings(path: string): Promise<ClaudeSettings> {
  if (!existsSync(path)) return {};
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeSettings(path: string, data: ClaudeSettings): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

function buildGraphifyStopHook(): StopHookEntry {
  return {
    matcher: "*",
    hooks: [
      {
        type: "command",
        // Run silently — errors shouldn't spam the user.
        // Runs in the project directory (CLAUDE_PROJECT_DIR provided by Claude Code).
        command: 'graphify auto-update "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true',
      },
    ],
  };
}

function isGraphifyHook(entry: StopHookEntry): boolean {
  return entry.hooks.some((h) => h.command?.includes(GRAPHIFY_MARKER));
}

export async function installHook(settingsPath: string = defaultSettingsPath()): Promise<void> {
  const settings = await readSettings(settingsPath);

  settings.hooks ??= {};
  settings.hooks.Stop ??= [];

  // Remove any existing graphify entries (ensures idempotence)
  settings.hooks.Stop = settings.hooks.Stop.filter((entry) => !isGraphifyHook(entry));

  // Add fresh entry
  settings.hooks.Stop.push(buildGraphifyStopHook());

  await writeSettings(settingsPath, settings);
}

export async function uninstallHook(settingsPath: string = defaultSettingsPath()): Promise<void> {
  const settings = await readSettings(settingsPath);
  if (!settings.hooks?.Stop) return;

  settings.hooks.Stop = settings.hooks.Stop.filter((entry) => !isGraphifyHook(entry));

  // Clean up empty arrays
  if (settings.hooks.Stop.length === 0) {
    delete settings.hooks.Stop;
  }

  await writeSettings(settingsPath, settings);
}

export async function hookStatus(
  settingsPath: string = defaultSettingsPath(),
): Promise<"installed" | "not-installed"> {
  const settings = await readSettings(settingsPath);
  const stopHooks = settings.hooks?.Stop ?? [];
  return stopHooks.some(isGraphifyHook) ? "installed" : "not-installed";
}
