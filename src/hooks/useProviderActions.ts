import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { providersApi, settingsApi } from "@/lib/api";
import type { SupportedAppId } from "@/config/appRegistry";
import type { Provider } from "@/types";
import {
  useAddProviderMutation,
  useDeleteProviderMutation,
  useSwitchProviderMutation,
  useUpdateProviderMutation,
} from "@/lib/query/mutations";
import { extractErrorMessage } from "@/utils/errorUtils";

type ProviderInput = Omit<Provider, "id"> & {
  ensureCodexOfficialSeed?: boolean;
};

/** Core Provider operations shared by the Claude Code and Codex adapters. */
export function useProviderActions(activeApp: SupportedAppId) {
  const { t } = useTranslation();
  const addProviderMutation = useAddProviderMutation(activeApp);
  const updateProviderMutation = useUpdateProviderMutation(activeApp);
  const deleteProviderMutation = useDeleteProviderMutation(activeApp);
  const switchProviderMutation = useSwitchProviderMutation(activeApp);

  const syncClaudePlugin = useCallback(
    async (provider: Provider) => {
      if (activeApp !== "claude") return;
      try {
        const settings = await settingsApi.get();
        if (settings?.enableClaudePluginIntegration) {
          await settingsApi.applyClaudePluginConfig({
            official: provider.category === "official",
          });
        }
      } catch (error) {
        toast.error(
          extractErrorMessage(error) ||
            t("notifications.syncClaudePluginFailed", {
              defaultValue: "同步 Claude 插件失败",
            }),
        );
      }
    },
    [activeApp, t],
  );

  const addProvider = useCallback(
    async (provider: ProviderInput) => {
      await addProviderMutation.mutateAsync(provider);
    },
    [addProviderMutation],
  );

  const updateProvider = useCallback(
    async (provider: Provider) => {
      await updateProviderMutation.mutateAsync({ provider });
      await providersApi.updateTrayMenu().catch((error) => {
        console.error(
          "Failed to update tray menu after provider update",
          error,
        );
      });
    },
    [updateProviderMutation],
  );

  const switchProvider = useCallback(
    async (provider: Provider) => {
      try {
        const result = await switchProviderMutation.mutateAsync(provider.id);
        await syncClaudePlugin(provider);
        if (result?.warnings?.length) {
          toast.warning(
            t("notifications.backfillWarning", {
              defaultValue: "切换成功，但旧配置回填失败；请检查当前配置文件。",
            }),
          );
        }
        toast.success(
          activeApp === "codex"
            ? t("notifications.codexRestartRequired", {
                defaultValue: "切换成功，请重启 Codex 以生效",
              })
            : t("notifications.switchSuccess", {
                defaultValue: "切换成功！",
              }),
          { closeButton: true },
        );
      } catch {
        // The mutation reports a copyable, redacted error to the user.
      }
    },
    [activeApp, switchProviderMutation, syncClaudePlugin, t],
  );

  const deleteProvider = useCallback(
    async (id: string) => {
      await deleteProviderMutation.mutateAsync(id);
    },
    [deleteProviderMutation],
  );

  return {
    addProvider,
    updateProvider,
    switchProvider,
    deleteProvider,
    isLoading:
      addProviderMutation.isPending ||
      updateProviderMutation.isPending ||
      deleteProviderMutation.isPending ||
      switchProviderMutation.isPending,
  };
}
