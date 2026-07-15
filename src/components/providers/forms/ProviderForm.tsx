import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TOML from "smol-toml";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BasicFormFields } from "./BasicFormFields";
import { providerSchema, type ProviderFormData } from "@/lib/schemas/provider";
import type {
  CodexCatalogModel,
  CustomEndpoint,
  ProviderCategory,
  ProviderMeta,
} from "@/types";
import type { SupportedAppId } from "@/config/appRegistry";
import { codexProviderPresets } from "@/config/codexProviderPresets";
import { providerPresets } from "@/config/claudeProviderPresets";
import {
  extractCodexBaseUrl,
  extractCodexModelName,
  extractCodexWireApi,
  setCodexBaseUrl,
  setCodexModelName,
} from "@/utils/providerConfigUtils";
import { cn } from "@/lib/utils";

type TemplateKind = "official" | "custom";

export interface ProviderFormProps {
  appId: SupportedAppId;
  providerId?: string;
  submitLabel: string;
  onSubmit: (values: ProviderFormValues) => Promise<void> | void;
  onCancel: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  initialData?: {
    name?: string;
    websiteUrl?: string;
    notes?: string;
    settingsConfig?: Record<string, unknown>;
    category?: ProviderCategory;
    meta?: ProviderMeta;
    icon?: string;
    iconColor?: string;
  };
  showButtons?: boolean;
}

export type ProviderFormValues = ProviderFormData & {
  presetId?: string;
  presetCategory?: ProviderCategory;
  meta?: ProviderMeta;
};

export function isSafeProviderUrl(rawValue: string): boolean {
  try {
    const url = new URL(rawValue.trim());
    if (url.protocol === "https:") return true;
    if (url.protocol !== "http:") return false;

    const hostname = url.hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

export function isCodexResponsesConfig(config: string): boolean {
  if (!config.trim()) return false;
  try {
    TOML.parse(config);
  } catch {
    return false;
  }
  return extractCodexWireApi(config)?.toLowerCase() === "responses";
}

export const normalizeCodexCatalogModelsForSave = (
  models: CodexCatalogModel[],
): CodexCatalogModel[] => {
  const seen = new Set<string>();
  const normalized: CodexCatalogModel[] = [];

  for (const item of models) {
    const model = item.model.trim();
    if (!model || seen.has(model)) continue;
    seen.add(model);

    const displayName = item.displayName?.trim();
    const rawContextWindow = String(item.contextWindow ?? "").replace(
      /[^\d]/g,
      "",
    );
    const contextWindow = rawContextWindow
      ? Number.parseInt(rawContextWindow, 10)
      : undefined;
    const inputModalities = item.inputModalities?.filter(
      (modality) => typeof modality === "string" && modality.trim(),
    );
    const baseInstructions = item.baseInstructions?.trim();

    normalized.push({
      model,
      ...(displayName ? { displayName } : {}),
      ...(contextWindow && contextWindow > 0 ? { contextWindow } : {}),
      ...(typeof item.supportsParallelToolCalls === "boolean"
        ? { supportsParallelToolCalls: item.supportsParallelToolCalls }
        : {}),
      ...(inputModalities?.length ? { inputModalities } : {}),
      ...(baseInstructions ? { baseInstructions } : {}),
    });
  }

  return normalized;
};

function parseClaudeSettings(
  settings: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!settings || Array.isArray(settings)) return { env: {} };
  const env =
    typeof settings.env === "object" &&
    settings.env !== null &&
    !Array.isArray(settings.env)
      ? settings.env
      : {};
  return { ...settings, env };
}

function parseCodexSettings(settings: Record<string, unknown> | undefined): {
  auth: Record<string, unknown>;
  config: string;
  rest: Record<string, unknown>;
} {
  const source = settings ?? {};
  const auth =
    typeof source.auth === "object" &&
    source.auth !== null &&
    !Array.isArray(source.auth)
      ? (source.auth as Record<string, unknown>)
      : {};
  const config = typeof source.config === "string" ? source.config : "";
  const { auth: _auth, config: _config, ...rest } = source;
  return { auth, config, rest };
}

export function ProviderForm({
  appId,
  submitLabel,
  onSubmit,
  onCancel,
  onSubmittingChange,
  initialData,
  showButtons = true,
}: ProviderFormProps) {
  const { t } = useTranslation();
  const initialKind: TemplateKind =
    initialData?.category === "official" ? "official" : "custom";
  const [templateKind, setTemplateKind] = useState<TemplateKind>(initialKind);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialClaudeSettings = useMemo(
    () => parseClaudeSettings(initialData?.settingsConfig),
    [initialData?.settingsConfig],
  );
  const initialClaudeEnv = initialClaudeSettings.env as Record<string, unknown>;
  const initialCodexSettings = useMemo(
    () => parseCodexSettings(initialData?.settingsConfig),
    [initialData?.settingsConfig],
  );

  const [claudeConfigText, setClaudeConfigText] = useState(() =>
    JSON.stringify(initialClaudeSettings, null, 2),
  );
  const [codexAuthText, setCodexAuthText] = useState(() =>
    JSON.stringify(initialCodexSettings.auth, null, 2),
  );
  const [codexConfigText, setCodexConfigText] = useState(
    initialCodexSettings.config,
  );
  const [apiKey, setApiKey] = useState(() =>
    appId === "claude"
      ? String(
          initialClaudeEnv.ANTHROPIC_AUTH_TOKEN ??
            initialClaudeEnv.ANTHROPIC_API_KEY ??
            "",
        )
      : String(initialCodexSettings.auth.OPENAI_API_KEY ?? ""),
  );
  const [baseUrl, setBaseUrl] = useState(() =>
    appId === "claude"
      ? String(initialClaudeEnv.ANTHROPIC_BASE_URL ?? "")
      : (extractCodexBaseUrl(initialCodexSettings.config) ?? ""),
  );
  const [model, setModel] = useState(() =>
    appId === "claude"
      ? String(initialClaudeEnv.ANTHROPIC_MODEL ?? "")
      : (extractCodexModelName(initialCodexSettings.config) ?? ""),
  );
  const [configError, setConfigError] = useState("");

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      websiteUrl: initialData?.websiteUrl ?? "",
      notes: initialData?.notes ?? "",
      settingsConfig:
        appId === "claude"
          ? JSON.stringify(initialClaudeSettings)
          : JSON.stringify({
              ...initialCodexSettings.rest,
              auth: initialCodexSettings.auth,
              config: initialCodexSettings.config,
            }),
      icon: initialData?.icon ?? "",
      iconColor: initialData?.iconColor ?? "",
    },
  });

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const updateClaudeEnv = (key: string, value: string) => {
    setClaudeConfigText((current) => {
      let settings: Record<string, unknown>;
      try {
        settings = parseClaudeSettings(JSON.parse(current));
      } catch {
        settings = { env: {} };
      }
      const env = { ...(settings.env as Record<string, unknown>) };
      if (key === "ANTHROPIC_AUTH_TOKEN") {
        delete env.ANTHROPIC_API_KEY;
      }
      if (value.trim()) env[key] = value.trim();
      else delete env[key];
      return JSON.stringify({ ...settings, env }, null, 2);
    });
  };

  const updateCodexAuth = (value: string) => {
    setCodexAuthText((current) => {
      let auth: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(current);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          auth = parsed;
        }
      } catch {
        // Replace invalid draft with a known-safe object when a structured field changes.
      }
      if (value.trim()) auth.OPENAI_API_KEY = value.trim();
      else delete auth.OPENAI_API_KEY;
      return JSON.stringify(auth, null, 2);
    });
  };

  const applyTemplate = (kind: TemplateKind) => {
    setTemplateKind(kind);
    setConfigError("");

    if (appId === "claude") {
      const preset =
        kind === "official" ? providerPresets[0] : providerPresets[1];
      form.setValue("name", preset.name);
      form.setValue("websiteUrl", preset.websiteUrl);
      form.setValue("icon", preset.icon ?? "");
      form.setValue("iconColor", preset.iconColor ?? "");
      setClaudeConfigText(JSON.stringify(preset.settingsConfig, null, 2));
    } else {
      const preset =
        kind === "official" ? codexProviderPresets[0] : codexProviderPresets[1];
      form.setValue("name", preset.name);
      form.setValue("websiteUrl", preset.websiteUrl);
      form.setValue("icon", preset.icon ?? "");
      form.setValue("iconColor", preset.iconColor ?? "");
      setCodexAuthText(JSON.stringify(preset.auth, null, 2));
      setCodexConfigText(preset.config);
    }

    setApiKey("");
    setBaseUrl("");
    setModel("");
  };

  const validateAndBuildSettings = (): Record<string, unknown> | null => {
    setConfigError("");

    if (appId === "claude") {
      let settings: Record<string, unknown>;
      try {
        const parsed = JSON.parse(claudeConfigText);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("settings.json must be a JSON object");
        }
        settings = parseClaudeSettings(parsed);
      } catch (error) {
        setConfigError(error instanceof Error ? error.message : "Invalid JSON");
        return null;
      }

      if (templateKind === "custom") {
        if (!baseUrl.trim() || !isSafeProviderUrl(baseUrl)) {
          setConfigError(
            "Base URL must use HTTPS. HTTP is allowed only for localhost, 127.0.0.1, or ::1.",
          );
          return null;
        }
        if (!apiKey.trim()) {
          setConfigError("API Key is required for a custom Claude provider.");
          return null;
        }
      }

      return settings;
    }

    let auth: Record<string, unknown>;
    try {
      const parsed = JSON.parse(codexAuthText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("auth.json must be a JSON object");
      }
      auth = parsed;
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "Invalid JSON");
      return null;
    }

    try {
      if (codexConfigText.trim()) TOML.parse(codexConfigText);
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "Invalid TOML");
      return null;
    }

    if (templateKind === "custom") {
      if (!baseUrl.trim() || !isSafeProviderUrl(baseUrl)) {
        setConfigError(
          "Base URL must use HTTPS. HTTP is allowed only for localhost, 127.0.0.1, or ::1.",
        );
        return null;
      }
      if (!apiKey.trim()) {
        setConfigError("API Key is required for a custom Codex provider.");
        return null;
      }
      if (!isCodexResponsesConfig(codexConfigText)) {
        setConfigError(
          'Custom Codex providers must set wire_api = "responses".',
        );
        return null;
      }
    }

    return { ...initialCodexSettings.rest, auth, config: codexConfigText };
  };

  const handleSubmit = async (values: ProviderFormData) => {
    if (!values.name.trim()) {
      toast.error(
        t("providerForm.fillSupplierName", {
          defaultValue: "请输入供应商名称",
        }),
      );
      return;
    }

    const settings = validateAndBuildSettings();
    if (!settings) return;

    setIsSubmitting(true);
    try {
      const nextMeta: ProviderMeta = { ...(initialData?.meta ?? {}) };
      if (templateKind === "custom" && baseUrl.trim()) {
        const normalizedUrl = baseUrl.trim().replace(/\/+$/, "");
        const existingEndpoint = nextMeta.custom_endpoints?.[normalizedUrl];
        const endpoint: CustomEndpoint = existingEndpoint ?? {
          url: normalizedUrl,
          addedAt: Date.now(),
        };
        nextMeta.custom_endpoints = { [normalizedUrl]: endpoint };
      } else {
        delete nextMeta.custom_endpoints;
        delete nextMeta.endpointAutoSelect;
      }
      nextMeta.apiFormat =
        appId === "claude" ? "anthropic" : "openai_responses";

      await onSubmit({
        ...values,
        settingsConfig: JSON.stringify(settings),
        presetId: `${appId}-${templateKind}`,
        presetCategory: templateKind === "official" ? "official" : "custom",
        meta: nextMeta,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const templateLabel = (kind: TemplateKind) => {
    if (appId === "claude") {
      return kind === "official"
        ? "Claude Code Official"
        : "Claude Code Custom Anthropic-Compatible";
    }
    return kind === "official"
      ? "Codex Official"
      : "Codex Custom OpenAI Responses-Compatible";
  };

  return (
    <Form {...form}>
      <form
        id="provider-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <section className="space-y-3" aria-label="Provider template">
          <Label>
            {t("providerForm.selectPreset", { defaultValue: "选择模板" })}
          </Label>
          <div className="grid gap-3 md:grid-cols-2">
            {(["official", "custom"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={templateKind === kind}
                onClick={() => applyTemplate(kind)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  templateKind === kind
                    ? "border-primary bg-primary/5"
                    : "border-border-default hover:bg-muted/50",
                )}
              >
                <span className="block text-sm font-medium">
                  {templateLabel(kind)}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {kind === "official"
                    ? t("providerForm.officialPresetHint", {
                        defaultValue:
                          "Use the application's official authentication flow.",
                      })
                    : t("providerForm.customPresetHint", {
                        defaultValue:
                          "Configure a native-compatible HTTPS endpoint.",
                      })}
                </span>
              </button>
            ))}
          </div>
        </section>

        <BasicFormFields form={form} />

        {templateKind === "custom" && (
          <section className="space-y-4 rounded-xl border border-border-default p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="provider-base-url">Base URL</Label>
                <Input
                  id="provider-base-url"
                  value={baseUrl}
                  placeholder={
                    appId === "claude"
                      ? "https://api.example.com"
                      : "https://api.example.com/v1"
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    setBaseUrl(value);
                    if (appId === "claude") {
                      updateClaudeEnv("ANTHROPIC_BASE_URL", value);
                    } else {
                      setCodexConfigText((current) =>
                        setCodexBaseUrl(current, value),
                      );
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-api-key">API Key</Label>
                <Input
                  id="provider-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(event) => {
                    const value = event.target.value;
                    setApiKey(value);
                    if (appId === "claude") {
                      updateClaudeEnv("ANTHROPIC_AUTH_TOKEN", value);
                    } else {
                      updateCodexAuth(value);
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-model">Default model</Label>
              <Input
                id="provider-model"
                value={model}
                placeholder={appId === "claude" ? "claude-sonnet-4-5" : "gpt-5"}
                onChange={(event) => {
                  const value = event.target.value;
                  setModel(value);
                  if (appId === "claude") {
                    updateClaudeEnv("ANTHROPIC_MODEL", value);
                  } else {
                    setCodexConfigText((current) =>
                      setCodexModelName(current, value),
                    );
                  }
                }}
              />
            </div>
          </section>
        )}

        <section className="space-y-2">
          <Label htmlFor="provider-advanced-config">
            {appId === "claude" ? "settings.json" : "config.toml"}
          </Label>
          {appId === "claude" ? (
            <Textarea
              id="provider-advanced-config"
              className="min-h-56 font-mono text-xs"
              value={claudeConfigText}
              onChange={(event) => {
                const value = event.target.value;
                setClaudeConfigText(value);
                try {
                  const parsed = parseClaudeSettings(JSON.parse(value));
                  const env = parsed.env as Record<string, unknown>;
                  setBaseUrl(String(env.ANTHROPIC_BASE_URL ?? ""));
                  setApiKey(
                    String(
                      env.ANTHROPIC_AUTH_TOKEN ?? env.ANTHROPIC_API_KEY ?? "",
                    ),
                  );
                  setModel(String(env.ANTHROPIC_MODEL ?? ""));
                } catch {
                  // Keep the invalid draft visible; submit validation reports it.
                }
              }}
            />
          ) : (
            <>
              <Textarea
                id="provider-advanced-config"
                className="min-h-56 font-mono text-xs"
                value={codexConfigText}
                onChange={(event) => {
                  const value = event.target.value;
                  setCodexConfigText(value);
                  setBaseUrl(extractCodexBaseUrl(value) ?? "");
                  setModel(extractCodexModelName(value) ?? "");
                }}
              />
              <Label htmlFor="provider-auth-config">auth.json</Label>
              <Textarea
                id="provider-auth-config"
                className="min-h-32 font-mono text-xs"
                value={codexAuthText}
                onChange={(event) => {
                  const value = event.target.value;
                  setCodexAuthText(value);
                  try {
                    const auth = JSON.parse(value) as Record<string, unknown>;
                    setApiKey(String(auth.OPENAI_API_KEY ?? ""));
                  } catch {
                    // Keep the invalid draft visible; submit validation reports it.
                  }
                }}
              />
            </>
          )}
          {configError && (
            <p role="alert" className="text-sm text-destructive">
              {configError}
            </p>
          )}
          <FormField
            control={form.control}
            name="settingsConfig"
            render={() => (
              <FormItem className="hidden">
                <FormControl>
                  <input type="hidden" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {showButtons && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
