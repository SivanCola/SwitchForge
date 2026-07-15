import type { IconMetadata } from "@/types/icon";

export const iconMetadata: Record<string, IconMetadata> = {
  anthropic: {
    name: "anthropic",
    displayName: "Anthropic",
    category: "ai-provider",
    keywords: ["anthropic", "claude"],
    defaultColor: "#D97757",
  },
  claude: {
    name: "claude",
    displayName: "Claude Code",
    category: "ai-provider",
    keywords: ["anthropic", "claude", "code"],
    defaultColor: "#D97757",
  },
  openai: {
    name: "openai",
    displayName: "OpenAI",
    category: "ai-provider",
    keywords: ["openai", "codex"],
    defaultColor: "#10A37F",
  },
  codex: {
    name: "codex",
    displayName: "Codex",
    category: "ai-provider",
    keywords: ["openai", "codex", "code"],
    defaultColor: "#10A37F",
  },
  mcp: {
    name: "mcp",
    displayName: "Model Context Protocol",
    category: "other",
    keywords: ["mcp", "model context protocol"],
    defaultColor: "currentColor",
  },
  github: {
    name: "github",
    displayName: "GitHub",
    category: "other",
    keywords: ["github", "git"],
    defaultColor: "currentColor",
  },
  generic: {
    name: "generic",
    displayName: "Generic Provider",
    category: "other",
    keywords: ["provider", "custom"],
    defaultColor: "currentColor",
  },
};

export function getIconMetadata(name: string): IconMetadata | undefined {
  return iconMetadata[name.toLowerCase()];
}

export function searchIcons(query: string): string[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return Object.keys(iconMetadata).sort();

  return Object.entries(iconMetadata)
    .filter(([name, metadata]) =>
      [name, metadata.displayName, ...metadata.keywords]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
    .map(([name]) => name)
    .sort();
}
