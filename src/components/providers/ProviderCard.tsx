import { useMemo } from "react";
import { GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import type { Provider } from "@/types";
import type { AppId } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ProviderActions } from "@/components/providers/ProviderActions";
import { ProviderIcon } from "@/components/ProviderIcon";
import { extractCodexBaseUrl } from "@/utils/providerConfigUtils";

interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
}

interface ProviderCardProps {
  provider: Provider;
  isCurrent: boolean;
  appId: AppId;
  onSwitch: (provider: Provider) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onDuplicate: (provider: Provider) => void;
  onOpenWebsite: (url: string) => void;
  onTest?: (provider: Provider) => void;
  onOpenTerminal?: (provider: Provider) => void;
  isTesting?: boolean;
  dragHandleProps?: DragHandleProps;
}

function extractDisplayUrl(provider: Provider, appId: AppId): string | null {
  if (provider.notes?.trim()) return provider.notes.trim();
  if (provider.websiteUrl?.trim()) return provider.websiteUrl.trim();
  const config = provider.settingsConfig as Record<string, any>;
  if (appId === "claude") {
    const baseUrl = config?.env?.ANTHROPIC_BASE_URL;
    return typeof baseUrl === "string" && baseUrl.trim()
      ? baseUrl.trim()
      : null;
  }
  if (appId === "codex" && typeof config?.config === "string") {
    return extractCodexBaseUrl(config.config) ?? null;
  }
  return null;
}

export function ProviderCard({
  provider,
  isCurrent,
  appId,
  onSwitch,
  onEdit,
  onDelete,
  onDuplicate,
  onOpenWebsite,
  onTest,
  onOpenTerminal,
  isTesting,
  dragHandleProps,
}: ProviderCardProps) {
  const { t } = useTranslation();
  const displayUrl = useMemo(
    () => extractDisplayUrl(provider, appId),
    [appId, provider],
  );
  const isClickableUrl = Boolean(
    displayUrl && !provider.notes?.trim() && displayUrl !== provider.name,
  );

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-4 text-card-foreground transition-all duration-300",
        "hover:border-border-active hover:shadow-sm",
        isCurrent && "border-blue-500/60 shadow-sm shadow-blue-500/10",
        dragHandleProps?.isDragging &&
          "z-10 scale-105 cursor-grabbing border-primary shadow-lg",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent transition-opacity",
          isCurrent ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className="-ml-1.5 shrink-0 cursor-grab p-1.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing"
            aria-label={t("provider.dragHandle")}
            {...(dragHandleProps?.attributes ?? {})}
            {...(dragHandleProps?.listeners ?? {})}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted transition-transform duration-300 group-hover:scale-105">
            <ProviderIcon
              icon={provider.icon}
              name={provider.name}
              color={provider.iconColor}
              size={20}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex min-h-7 flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-none">
                {provider.name}
              </h3>
              {provider.category === "official" && (
                <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700/60 dark:text-slate-200">
                  {t("provider.official", { defaultValue: "Official" })}
                </span>
              )}
            </div>
            {displayUrl && (
              <button
                type="button"
                disabled={!isClickableUrl}
                onClick={() => isClickableUrl && onOpenWebsite(displayUrl)}
                className={cn(
                  "inline-flex max-w-full items-center overflow-hidden text-left text-sm",
                  isClickableUrl
                    ? "cursor-pointer text-blue-500 hover:underline dark:text-blue-400"
                    : "cursor-default text-muted-foreground",
                )}
                title={displayUrl}
              >
                <span className="truncate">{displayUrl}</span>
              </button>
            )}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <ProviderActions
            isCurrent={isCurrent}
            isTesting={isTesting}
            onSwitch={() => onSwitch(provider)}
            onEdit={() => onEdit(provider)}
            onDuplicate={() => onDuplicate(provider)}
            onTest={onTest ? () => onTest(provider) : undefined}
            onDelete={() => onDelete(provider)}
            onOpenTerminal={
              onOpenTerminal ? () => onOpenTerminal(provider) : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
