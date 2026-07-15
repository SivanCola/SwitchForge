import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "src");
const localeRoot = path.join(sourceRoot, "i18n", "locales");

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entryPath === localeRoot) continue;
      files.push(...(await collectSourceFiles(entryPath)));
    } else if (/\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

function flatten(value, prefix = "", output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flatten(child, fullKey, output);
    } else {
      output.set(fullKey, child);
    }
  }
  return output;
}

function unflatten(entries) {
  const result = {};
  for (const [fullKey, value] of entries) {
    const parts = fullKey.split(".");
    let cursor = result;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) cursor[part] = value;
      else cursor = cursor[part] ??= {};
    });
  }
  return result;
}

function migrateActiveKeys(locale) {
  if (locale.streamCheck) {
    locale.connectivityCheck = locale.streamCheck;
    delete locale.streamCheck;
  }
  const storage = locale.settings?.skillStorage;
  if (storage?.ccSwitch !== undefined) {
    storage.switchforge = storage.ccSwitch;
    delete storage.ccSwitch;
  }
  if (storage?.ccSwitchHint !== undefined) {
    storage.switchforgeHint = storage.ccSwitchHint;
    delete storage.ccSwitchHint;
  }
  if (typeof storage?.unifiedHint === "string") {
    storage.unifiedHint = storage.unifiedHint.replace(
      /, Gemini CLI, etc\.|、Gemini CLI 等）/,
      ".",
    );
  }
}

const files = await collectSourceFiles(sourceRoot);
const source = (
  await Promise.all(files.map((file) => readFile(file, "utf8")))
).join("\n");
const literalKeys = new Set();
for (const match of source.matchAll(/["'`]([A-Za-z0-9_.:-]+)["'`]/g)) {
  if (match[1].includes(".")) literalKeys.add(match[1]);
}

const dynamicPrefixes = [
  "mcp.presets.",
  "settings.advanced.logConfig.levels.",
];

for (const language of ["en", "zh"]) {
  const localePath = path.join(localeRoot, `${language}.json`);
  const locale = JSON.parse(await readFile(localePath, "utf8"));
  migrateActiveKeys(locale);
  const entries = [...flatten(locale)].filter(([key]) => {
    if (literalKeys.has(key)) return true;
    if (dynamicPrefixes.some((prefix) => key.startsWith(prefix))) return true;
    return ["_zero", "_one", "_other"].some(
      (suffix) => key.endsWith(suffix) && literalKeys.has(key.slice(0, -suffix.length)),
    );
  });
  await writeFile(
    localePath,
    `${JSON.stringify(unflatten(entries), null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`${language}: kept ${entries.length} translation strings\n`);
}
