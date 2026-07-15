import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { providersApi, settingsApi } from "@/lib/api";
import type { Provider, Settings } from "@/types";
import type { SupportedAppId } from "@/config/appRegistry";

const sortProviders = (
  providers: Record<string, Provider>,
): Record<string, Provider> => {
  const entries = Object.values(providers)
    .sort((left, right) => {
      const leftIndex = left.sortIndex ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = right.sortIndex ?? Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;

      const leftCreatedAt = left.createdAt ?? 0;
      const rightCreatedAt = right.createdAt ?? 0;
      if (leftCreatedAt !== rightCreatedAt) {
        return leftCreatedAt - rightCreatedAt;
      }
      return left.name.localeCompare(right.name, "zh-CN");
    })
    .map((provider) => [provider.id, provider] as const);

  return Object.fromEntries(entries);
};

export interface ProvidersQueryData {
  providers: Record<string, Provider>;
  currentProviderId: string;
}

export const useProvidersQuery = (
  appId: SupportedAppId,
): UseQueryResult<ProvidersQueryData> =>
  useQuery({
    queryKey: ["providers", appId],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const [providersResult, currentResult] = await Promise.allSettled([
        providersApi.getAll(appId),
        providersApi.getCurrent(appId),
      ]);
      if (providersResult.status === "rejected") {
        console.error("Failed to load providers", providersResult.reason);
      }
      if (currentResult.status === "rejected") {
        console.error("Failed to load current provider", currentResult.reason);
      }

      const providers =
        providersResult.status === "fulfilled" ? providersResult.value : {};
      const currentProviderId =
        currentResult.status === "fulfilled" ? currentResult.value : "";
      return {
        providers: sortProviders(providers),
        currentProviderId,
      };
    },
  });

export const useSettingsQuery = (): UseQueryResult<Settings> =>
  useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });
