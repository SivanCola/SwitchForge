import type { ProviderCategory } from "../types";

export interface TemplateValueConfig {
  label: string;
  placeholder: string;
  defaultValue?: string;
  editorValue: string;
}

export interface PresetTheme {
  icon?: "claude" | "codex" | "gemini" | "generic";
  backgroundColor?: string;
  textColor?: string;
}

/**
 * SwitchForge intentionally ships only an official Claude Code template and a
 * protocol-compatible custom template. Provider promotions, affiliate links,
 * OAuth bridges, and protocol-conversion presets are not part of this project.
 */
export interface ProviderPreset {
  name: string;
  nameKey?: string;
  websiteUrl: string;
  apiKeyUrl?: string;
  settingsConfig: object;
  isOfficial?: boolean;
  category?: ProviderCategory;
  apiKeyField?: "ANTHROPIC_AUTH_TOKEN" | "ANTHROPIC_API_KEY";
  templateValues?: Record<string, TemplateValueConfig>;
  endpointCandidates?: string[];
  theme?: PresetTheme;
  icon?: string;
  iconColor?: string;
  apiFormat?: "anthropic";
  hidden?: boolean;
  modelsUrl?: string;
}

export const providerPresets: ProviderPreset[] = [
  {
    name: "Claude Code Official",
    websiteUrl: "https://www.anthropic.com/claude-code",
    settingsConfig: { env: {} },
    isOfficial: true,
    category: "official",
    apiFormat: "anthropic",
    theme: {
      icon: "claude",
      backgroundColor: "#D97757",
      textColor: "#FFFFFF",
    },
    icon: "anthropic",
    iconColor: "#D97757",
  },
  {
    name: "Claude Code Custom",
    websiteUrl: "",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "",
        ANTHROPIC_AUTH_TOKEN: "",
      },
    },
    category: "custom",
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    apiFormat: "anthropic",
    theme: { icon: "generic" },
  },
];
