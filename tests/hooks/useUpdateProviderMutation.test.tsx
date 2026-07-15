import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUpdateProviderMutation } from "@/lib/query/mutations";
import type { Provider } from "@/types";

const apiMocks = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock("@/lib/api", () => ({
  providersApi: {
    update: (...args: unknown[]) => apiMocks.update(...args),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateSpy };
}

beforeEach(() => {
  apiMocks.update.mockReset().mockResolvedValue(true);
});

describe("useUpdateProviderMutation", () => {
  it("updates a core provider and invalidates its list", async () => {
    const { wrapper, invalidateSpy } = createWrapper();
    const provider: Provider = {
      id: "provider-b",
      name: "Test Provider",
      settingsConfig: {},
    };
    const { result } = renderHook(() => useUpdateProviderMutation("codex"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ provider });
    });

    expect(apiMocks.update).toHaveBeenCalledWith(provider, "codex");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["providers", "codex"],
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });
});
