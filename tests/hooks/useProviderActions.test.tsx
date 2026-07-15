import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProviderActions } from "@/hooks/useProviderActions";
import type { Provider } from "@/types";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastWarningMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
    warning: (...args: unknown[]) => toastWarningMock(...args),
  },
}));

const addProviderMutateAsync = vi.fn();
const updateProviderMutateAsync = vi.fn();
const deleteProviderMutateAsync = vi.fn();
const switchProviderMutateAsync = vi.fn();

vi.mock("@/lib/query/mutations", () => ({
  useAddProviderMutation: () => ({
    mutateAsync: addProviderMutateAsync,
    isPending: false,
  }),
  useUpdateProviderMutation: () => ({
    mutateAsync: updateProviderMutateAsync,
    isPending: false,
  }),
  useDeleteProviderMutation: () => ({
    mutateAsync: deleteProviderMutateAsync,
    isPending: false,
  }),
  useSwitchProviderMutation: () => ({
    mutateAsync: switchProviderMutateAsync,
    isPending: false,
  }),
}));

const updateTrayMenuMock = vi.fn();
const settingsGetMock = vi.fn();
const applyClaudePluginConfigMock = vi.fn();

vi.mock("@/lib/api", () => ({
  providersApi: {
    updateTrayMenu: (...args: unknown[]) => updateTrayMenuMock(...args),
  },
  settingsApi: {
    get: (...args: unknown[]) => settingsGetMock(...args),
    applyClaudePluginConfig: (...args: unknown[]) =>
      applyClaudePluginConfigMock(...args),
  },
}));

function createProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: "provider-1",
    name: "Test Provider",
    settingsConfig: {},
    category: "official",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  updateTrayMenuMock.mockResolvedValue(undefined);
  settingsGetMock.mockResolvedValue({ enableClaudePluginIntegration: false });
  applyClaudePluginConfigMock.mockResolvedValue(undefined);
});

describe("useProviderActions core flow", () => {
  it("adds a provider through the core mutation", async () => {
    const input = {
      name: "New Provider",
      settingsConfig: { env: { ANTHROPIC_API_KEY: "secret" } },
    } as Omit<Provider, "id">;
    const { result } = renderHook(() => useProviderActions("claude"));

    await act(async () => result.current.addProvider(input));

    expect(addProviderMutateAsync).toHaveBeenCalledWith(input);
  });

  it("updates a provider and refreshes the tray", async () => {
    const provider = createProvider();
    const { result } = renderHook(() => useProviderActions("claude"));

    await act(async () => result.current.updateProvider(provider, "old-id"));

    expect(updateProviderMutateAsync).toHaveBeenCalledWith({
      provider,
      originalId: "old-id",
    });
    expect(updateTrayMenuMock).toHaveBeenCalledOnce();
  });

  it("switches Claude and syncs the optional plugin setting", async () => {
    settingsGetMock.mockResolvedValue({ enableClaudePluginIntegration: true });
    switchProviderMutateAsync.mockResolvedValue({ warnings: [] });
    const provider = createProvider({ category: "official" });
    const { result } = renderHook(() => useProviderActions("claude"));

    await act(async () => result.current.switchProvider(provider));

    expect(switchProviderMutateAsync).toHaveBeenCalledWith(provider.id);
    expect(applyClaudePluginConfigMock).toHaveBeenCalledWith({
      official: true,
    });
    expect(toastSuccessMock).toHaveBeenCalledOnce();
  });

  it("switches Codex without touching Claude plugin state", async () => {
    switchProviderMutateAsync.mockResolvedValue({ warnings: ["backfill"] });
    const provider = createProvider({ category: "custom" });
    const { result } = renderHook(() => useProviderActions("codex"));

    await act(async () => result.current.switchProvider(provider));

    expect(settingsGetMock).not.toHaveBeenCalled();
    expect(applyClaudePluginConfigMock).not.toHaveBeenCalled();
    expect(toastWarningMock).toHaveBeenCalledOnce();
    expect(toastSuccessMock).toHaveBeenCalledOnce();
  });

  it("deletes a provider through the core mutation", async () => {
    const { result } = renderHook(() => useProviderActions("claude"));

    await act(async () => result.current.deleteProvider("provider-1"));

    expect(deleteProviderMutateAsync).toHaveBeenCalledWith("provider-1");
  });
});
