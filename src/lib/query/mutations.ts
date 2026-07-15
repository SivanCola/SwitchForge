import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { providersApi, settingsApi } from "@/lib/api";
import type { SwitchResult } from "@/lib/api/providers";
import type { Provider, Settings } from "@/types";
import type { SupportedAppId } from "@/config/appRegistry";
import { extractErrorMessage } from "@/utils/errorUtils";
import { generateUUID } from "@/utils/uuid";
import { CODEX_OFFICIAL_PROVIDER_ID } from "@/utils/providerCapabilities";

type ProviderInput = Omit<Provider, "id"> & {
  ensureCodexOfficialSeed?: boolean;
};

async function refreshTray(): Promise<void> {
  try {
    await providersApi.updateTrayMenu();
  } catch (error) {
    console.error("Failed to refresh the tray provider menu", error);
  }
}

export const useAddProviderMutation = (appId: SupportedAppId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (providerInput: ProviderInput) => {
      const { ensureCodexOfficialSeed, ...providerData } = providerInput;

      if (appId === "codex" && ensureCodexOfficialSeed) {
        await providersApi.ensureCodexOfficialProvider();
        const providers = await providersApi.getAll(appId);
        const officialProvider = providers[CODEX_OFFICIAL_PROVIDER_ID];
        if (!officialProvider) {
          throw new Error("Codex official provider was not created");
        }
        return officialProvider;
      }

      const provider: Provider = {
        ...providerData,
        id: generateUUID(),
        createdAt: Date.now(),
      };
      await providersApi.add(provider, appId);
      return provider;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers", appId] });
      await refreshTray();
      toast.success(
        t("notifications.providerAdded", {
          defaultValue: "供应商已添加",
        }),
        { closeButton: true },
      );
    },
    onError: (error: Error) => {
      const detail = extractErrorMessage(error) || t("common.unknown");
      toast.error(
        t("notifications.addFailed", {
          defaultValue: "添加供应商失败: {{error}}",
          error: detail,
        }),
      );
    },
  });
};

export const useUpdateProviderMutation = (appId: SupportedAppId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ provider }: { provider: Provider }) => {
      await providersApi.update(provider, appId);
      return provider;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers", appId] });
      toast.success(
        t("notifications.updateSuccess", {
          defaultValue: "供应商更新成功",
        }),
        { closeButton: true },
      );
    },
    onError: (error: Error) => {
      const detail = extractErrorMessage(error) || t("common.unknown");
      toast.error(
        t("notifications.updateFailed", {
          defaultValue: "更新供应商失败: {{error}}",
          error: detail,
        }),
      );
    },
  });
};

export const useDeleteProviderMutation = (appId: SupportedAppId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (providerId: string) => {
      await providersApi.delete(providerId, appId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers", appId] });
      await refreshTray();
      toast.success(
        t("notifications.deleteSuccess", {
          defaultValue: "供应商已删除",
        }),
        { closeButton: true },
      );
    },
    onError: (error: Error) => {
      const detail = extractErrorMessage(error) || t("common.unknown");
      toast.error(
        t("notifications.deleteFailed", {
          defaultValue: "删除供应商失败: {{error}}",
          error: detail,
        }),
      );
    },
  });
};

export const useSwitchProviderMutation = (appId: SupportedAppId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (providerId: string): Promise<SwitchResult> =>
      providersApi.switch(providerId, appId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["providers", appId] });
      await refreshTray();
    },
    onError: (error: Error) => {
      const detail = extractErrorMessage(error) || t("common.unknown");
      toast.error(
        t("notifications.switchFailedTitle", { defaultValue: "切换失败" }),
        {
          description: t("notifications.switchFailed", {
            defaultValue: "切换失败：{{error}}",
            error: detail,
          }),
          duration: 6000,
          action: {
            label: t("common.copy", { defaultValue: "复制" }),
            onClick: () => {
              navigator.clipboard?.writeText(detail).catch(() => undefined);
            },
          },
        },
      );
    },
  });
};

export const useSaveSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Settings) => settingsApi.save(settings),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};
