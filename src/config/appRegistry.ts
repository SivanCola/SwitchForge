import type { AppId } from "@/lib/api";

export const APP_REGISTRY = {
  claude: {
    id: "claude",
    label: "Claude Code",
    icon: "claude",
  },
  codex: {
    id: "codex",
    label: "Codex",
    icon: "openai",
  },
} as const satisfies Record<
  "claude" | "codex",
  { id: AppId; label: string; icon: string }
>;

export type SupportedAppId = keyof typeof APP_REGISTRY;

export const SUPPORTED_APP_IDS = Object.freeze(
  Object.keys(APP_REGISTRY) as SupportedAppId[],
);

export function isSupportedAppId(value: unknown): value is SupportedAppId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(APP_REGISTRY, value)
  );
}
