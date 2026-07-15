export type ProviderCategory = "official" | "custom";

export interface Provider {
  id: string;
  name: string;
  settingsConfig: Record<string, unknown>;
  websiteUrl?: string;
  category?: ProviderCategory;
  createdAt?: number;
  sortIndex?: number;
  notes?: string;
  meta?: ProviderMeta;
  icon?: string;
  iconColor?: string;
}

export interface CustomEndpoint {
  url: string;
  addedAt: number;
  lastUsed?: number;
}

export type ClaudeApiKeyField = "ANTHROPIC_AUTH_TOKEN" | "ANTHROPIC_API_KEY";

export type CodexApiFormat = "openai_responses";

export interface ProviderMeta {
  custom_endpoints?: Record<string, CustomEndpoint>;
  endpointAutoSelect?: boolean;
  commonConfigEnabled?: boolean;
  apiFormat?: "anthropic" | "openai_responses";
  apiKeyField?: ClaudeApiKeyField;
}

export interface CodexCatalogModel {
  model: string;
  displayName?: string;
  contextWindow?: string | number;
  supportsParallelToolCalls?: boolean;
  inputModalities?: string[];
  baseInstructions?: string;
}

export type SkillSyncMethod = "auto" | "symlink" | "copy";
export type SkillStorageLocation = "switchforge" | "unified";

/** Device-local settings. Database-backed domain data is stored separately. */
export interface Settings {
  showInTray: boolean;
  minimizeToTrayOnClose: boolean;
  useAppWindowControls?: boolean;
  enableClaudePluginIntegration?: boolean;
  skipClaudeOnboarding?: boolean;
  launchOnStartup?: boolean;
  silentStartup?: boolean;
  firstRunNoticeConfirmed?: boolean;
  language?: "en" | "zh";
  claudeConfigDir?: string;
  codexConfigDir?: string;
  currentProviderClaude?: string;
  currentProviderCodex?: string;
  skillSyncMethod?: SkillSyncMethod;
  skillStorageLocation?: SkillStorageLocation;
  backupIntervalHours?: number;
  backupRetainCount?: number;
  preferredTerminal?: string;
}

export interface McpServerSpec {
  type?: "stdio" | "http" | "sse";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export interface McpApps {
  claude: boolean;
  codex: boolean;
}

export interface McpServer {
  id: string;
  name: string;
  server: McpServerSpec;
  apps: McpApps;
  description?: string;
  tags?: string[];
  homepage?: string;
  docs?: string;
  meta?: {
    docs?: string;
    homepage?: string;
    tags?: string[];
  };
  enabled?: boolean;
  source?: string;
}

export type McpServersMap = Record<string, McpServer>;

export interface McpStatus {
  userConfigPath: string;
  userConfigExists: boolean;
  serverCount: number;
}

export interface McpConfigResponse {
  configPath: string;
  servers: Record<string, McpServer>;
}
