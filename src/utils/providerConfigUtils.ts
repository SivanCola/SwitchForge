import { normalizeTomlText } from "@/utils/textNormalization";

const SECTION_PATTERN = /^\s*\[([^\]\r\n]+)\]\s*(?:#.*)?$/;
const MODEL_PROVIDER_PATTERN =
  /^\s*model_provider\s*=\s*("(?:\\.|[^"\\])*"|'[^']*')\s*(?:#.*)?$/;
const MODEL_PATTERN = /^\s*model\s*=\s*("(?:\\.|[^"\\])*"|'[^']*')\s*(?:#.*)?$/;
const BASE_URL_PATTERN =
  /^\s*base_url\s*=\s*("(?:\\.|[^"\\])*"|'[^']*')\s*(?:#.*)?$/;
const WIRE_API_PATTERN =
  /^\s*wire_api\s*=\s*("(?:\\.|[^"\\])*"|'[^']*')\s*(?:#.*)?$/;

interface SectionRange {
  start: number;
  end: number;
}

function decodeTomlString(raw: string): string | undefined {
  if (raw.startsWith("'")) return raw.slice(1, -1);
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

function encodeTomlString(value: string): string {
  return JSON.stringify(value);
}

function topLevelEnd(lines: string[]): number {
  const index = lines.findIndex((line) => SECTION_PATTERN.test(line));
  return index === -1 ? lines.length : index;
}

function findTopLevelValue(
  lines: string[],
  pattern: RegExp,
): string | undefined {
  for (let index = 0; index < topLevelEnd(lines); index += 1) {
    const match = lines[index].match(pattern);
    if (match) return decodeTomlString(match[1]);
  }
  return undefined;
}

function findSection(lines: string[], name: string): SectionRange | undefined {
  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(SECTION_PATTERN);
    if (!match) continue;
    if (start !== -1) return { start, end: index };
    if (match[1].trim() === name) start = index + 1;
  }
  return start === -1 ? undefined : { start, end: lines.length };
}

function activeProviderSection(lines: string[]): string | undefined {
  const provider = findTopLevelValue(lines, MODEL_PROVIDER_PATTERN)?.trim();
  return provider ? `model_providers.${provider}` : undefined;
}

function findSectionValue(
  lines: string[],
  range: SectionRange,
  pattern: RegExp,
): string | undefined {
  for (let index = range.start; index < range.end; index += 1) {
    const match = lines[index].match(pattern);
    if (match) return decodeTomlString(match[1]);
  }
  return undefined;
}

function finish(lines: string[]): string {
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+/, "");
}

/** Return the wire API declared by the active Codex model provider. */
export function extractCodexWireApi(configText: string): string | undefined {
  const lines = normalizeTomlText(configText).split("\n");
  const sectionName = activeProviderSection(lines);
  if (!sectionName) return undefined;
  const section = findSection(lines, sectionName);
  return section
    ? findSectionValue(lines, section, WIRE_API_PATTERN)
    : undefined;
}

/** Return the base URL declared by the active Codex model provider. */
export function extractCodexBaseUrl(configText: string): string | undefined {
  const lines = normalizeTomlText(configText).split("\n");
  const sectionName = activeProviderSection(lines);
  if (!sectionName) return undefined;
  const section = findSection(lines, sectionName);
  return section
    ? findSectionValue(lines, section, BASE_URL_PATTERN)
    : undefined;
}

/**
 * Update the active provider base URL without reserializing the TOML document,
 * so comments and unrelated user settings remain intact.
 */
export function setCodexBaseUrl(configText: string, rawValue: string): string {
  const value = rawValue.trim();
  const lines = normalizeTomlText(configText).split("\n");
  const provider = findTopLevelValue(lines, MODEL_PROVIDER_PATTERN)?.trim();
  if (!provider) return configText;

  const sectionName = `model_providers.${provider}`;
  const section = findSection(lines, sectionName);
  if (!section) {
    if (!value) return finish(lines);
    const separator = lines.length > 0 && lines.at(-1)?.trim() ? [""] : [];
    return finish([
      ...lines,
      ...separator,
      `[${sectionName}]`,
      `base_url = ${encodeTomlString(value)}`,
    ]);
  }

  for (let index = section.start; index < section.end; index += 1) {
    if (!BASE_URL_PATTERN.test(lines[index])) continue;
    if (!value) lines.splice(index, 1);
    else lines[index] = `base_url = ${encodeTomlString(value)}`;
    return finish(lines);
  }

  if (value)
    lines.splice(section.end, 0, `base_url = ${encodeTomlString(value)}`);
  return finish(lines);
}

/** Return the top-level Codex model name. */
export function extractCodexModelName(configText: string): string | undefined {
  return findTopLevelValue(
    normalizeTomlText(configText).split("\n"),
    MODEL_PATTERN,
  );
}

/** Update or remove the top-level Codex model name. */
export function setCodexModelName(
  configText: string,
  rawValue: string,
): string {
  const value = rawValue.trim();
  const lines = normalizeTomlText(configText).split("\n");
  const end = topLevelEnd(lines);

  for (let index = 0; index < end; index += 1) {
    if (!MODEL_PATTERN.test(lines[index])) continue;
    if (!value) lines.splice(index, 1);
    else lines[index] = `model = ${encodeTomlString(value)}`;
    return finish(lines);
  }

  if (value) lines.splice(end, 0, `model = ${encodeTomlString(value)}`);
  return finish(lines);
}
