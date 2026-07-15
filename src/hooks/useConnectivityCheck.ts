import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  checkProviderConnectivity,
  type ConnectivityCheckResult,
} from "@/lib/api/connectivity";
import type { AppId } from "@/lib/api";

/** Probe a provider base URL without sending a real model request. */
export function useConnectivityCheck(appId: AppId) {
  const { t } = useTranslation();
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  const checkProvider = useCallback(
    async (
      providerId: string,
      providerName: string,
    ): Promise<ConnectivityCheckResult | null> => {
      setCheckingIds((previous) => new Set(previous).add(providerId));

      try {
        const result = await checkProviderConnectivity(appId, providerId);

        if (result.status === "operational") {
          toast.success(
            t("connectivityCheck.reachable", {
              providerName,
              responseTimeMs: result.responseTimeMs,
            }),
            { closeButton: true },
          );
        } else if (result.status === "degraded") {
          toast.warning(
            t("connectivityCheck.reachableSlow", {
              providerName,
              responseTimeMs: result.responseTimeMs,
            }),
          );
        } else {
          toast.error(
            t("connectivityCheck.unreachable", {
              providerName,
              message: result.message,
            }),
            {
              description: t("connectivityCheck.unreachableHint"),
              duration: 8000,
              closeButton: true,
            },
          );
        }

        return result;
      } catch (error) {
        toast.error(
          t("connectivityCheck.error", {
            providerName,
            error: String(error),
          }),
        );
        return null;
      } finally {
        setCheckingIds((previous) => {
          const next = new Set(previous);
          next.delete(providerId);
          return next;
        });
      }
    },
    [appId, t],
  );

  const isChecking = useCallback(
    (providerId: string) => checkingIds.has(providerId),
    [checkingIds],
  );

  return { checkProvider, isChecking };
}
