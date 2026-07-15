import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FullScreenPanel } from "@/components/common/FullScreenPanel";
import type { CustomEndpoint, Provider } from "@/types";
import type { SupportedAppId } from "@/config/appRegistry";
import {
  ProviderForm,
  type ProviderFormValues,
} from "@/components/providers/forms/ProviderForm";
import { extractCodexBaseUrl } from "@/utils/providerConfigUtils";

interface AddProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: SupportedAppId;
  onSubmit: (
    provider: Omit<Provider, "id"> & { ensureCodexOfficialSeed?: boolean },
  ) => Promise<void> | void;
}

export function AddProviderDialog({
  open,
  onOpenChange,
  appId,
  onSubmit,
}: AddProviderDialogProps) {
  const { t } = useTranslation();
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (values: ProviderFormValues) => {
      const parsedConfig = JSON.parse(values.settingsConfig) as Record<
        string,
        unknown
      >;
      const providerData: Omit<Provider, "id"> & {
        ensureCodexOfficialSeed?: boolean;
      } = {
        name: values.name.trim(),
        notes: values.notes?.trim() || undefined,
        websiteUrl: values.websiteUrl?.trim() || undefined,
        settingsConfig: parsedConfig,
        icon: values.icon?.trim() || undefined,
        iconColor: values.iconColor?.trim() || undefined,
        category: values.presetCategory ?? "custom",
        ...(values.meta ? { meta: values.meta } : {}),
      };

      if (appId === "codex") {
        providerData.ensureCodexOfficialSeed =
          values.presetCategory === "official";
      }

      if (!providerData.meta?.custom_endpoints) {
        const rawUrl =
          appId === "claude"
            ? (parsedConfig.env as Record<string, unknown> | undefined)
                ?.ANTHROPIC_BASE_URL
            : extractCodexBaseUrl(
                typeof parsedConfig.config === "string"
                  ? parsedConfig.config
                  : "",
              );
        const url =
          typeof rawUrl === "string" ? rawUrl.replace(/\/+$/, "") : "";

        if (url) {
          const endpoint: CustomEndpoint = { url, addedAt: Date.now() };
          providerData.meta = {
            ...(providerData.meta ?? {}),
            custom_endpoints: { [url]: endpoint },
          };
        }
      }

      await onSubmit(providerData);
      onOpenChange(false);
    },
    [appId, onOpenChange, onSubmit],
  );

  return (
    <FullScreenPanel
      isOpen={open}
      title={t("provider.addNewProvider")}
      onClose={() => onOpenChange(false)}
      contentClassName="pt-3"
      footer={
        <>
          <span className="mr-auto min-w-0 truncate text-xs text-muted-foreground">
            {t("provider.addFooterHint")}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="provider-form"
            disabled={isFormSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("common.add")}
          </Button>
        </>
      }
    >
      <ProviderForm
        appId={appId}
        submitLabel={t("common.add")}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        onSubmittingChange={setIsFormSubmitting}
        showButtons={false}
      />
    </FullScreenPanel>
  );
}
