import type {
  CodexApiFormat,
  CodexCatalogModel,
  ProviderCategory,
} from "../types";
import type { PresetTheme } from "./claudeProviderPresets";

export interface CodexProviderPreset {
  name: string;
  nameKey?: string;
  websiteUrl: string;
  apiKeyUrl?: string;
  auth: Record<string, unknown>;
  config: string;
  isOfficial?: boolean;
  category?: ProviderCategory;
  isCustomTemplate?: boolean;
  endpointCandidates?: string[];
  theme?: PresetTheme;
  icon?: string;
  iconColor?: string;
  apiFormat?: CodexApiFormat;
  modelCatalog?: CodexCatalogModel[];
}

export function generateThirdPartyAuth(apiKey: string): Record<string, string> {
  return { OPENAI_API_KEY: apiKey };
}

export function generateThirdPartyConfig(
  providerName: string,
  baseUrl: string,
  modelName = "gpt-5",
): string {
  const tomlString = (value: string) => JSON.stringify(value);
  return `model_provider = "custom"
model = ${tomlString(modelName)}
disable_response_storage = true

[model_providers.custom]
name = ${tomlString(providerName)}
base_url = ${tomlString(baseUrl)}
wire_api = "responses"
requires_openai_auth = true
`;
}

/**
 * SwitchForge supports native Codex Responses endpoints only.
 */
export const codexProviderPresets: CodexProviderPreset[] = [
  {
    name: "Codex Official",
    websiteUrl: "https://chatgpt.com/codex",
    auth: {},
    config: "",
    isOfficial: true,
    category: "official",
    apiFormat: "openai_responses",
    theme: {
      icon: "codex",
      backgroundColor: "#1F2937",
      textColor: "#FFFFFF",
    },
    icon: "openai",
    iconColor: "#00A67E",
  },
  {
    name: "Codex Custom",
    websiteUrl: "",
    auth: generateThirdPartyAuth(""),
    config: generateThirdPartyConfig(
      "custom",
      "https://api.example.com/v1",
      "gpt-5",
    ),
    category: "custom",
    isCustomTemplate: true,
    apiFormat: "openai_responses",
    theme: { icon: "generic" },
  },
];
