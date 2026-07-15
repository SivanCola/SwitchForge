import {
  Activity,
  Check,
  Copy,
  Edit,
  Loader2,
  Play,
  Terminal,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProviderActionsProps {
  isCurrent: boolean;
  isTesting?: boolean;
  onSwitch: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onTest?: () => void;
  onDelete: () => void;
  onOpenTerminal?: () => void;
}

export function ProviderActions({
  isCurrent,
  isTesting,
  onSwitch,
  onEdit,
  onDuplicate,
  onTest,
  onDelete,
  onOpenTerminal,
}: ProviderActionsProps) {
  const { t } = useTranslation();
  const iconButtonClass = "h-8 w-8 p-1";

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant={isCurrent ? "secondary" : "default"}
        disabled={isCurrent}
        onClick={onSwitch}
        className={cn(
          "w-[4.5rem] px-2.5",
          isCurrent &&
            "cursor-not-allowed bg-gray-200 text-muted-foreground dark:bg-gray-700",
        )}
      >
        {isCurrent ? (
          <Check className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isCurrent ? t("provider.inUse") : t("provider.enable")}
      </Button>

      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          title={t("common.edit")}
          className={iconButtonClass}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDuplicate}
          title={t("provider.duplicate")}
          className={iconButtonClass}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onTest}
          disabled={!onTest || isTesting}
          title={t("provider.connectivityCheck", "检测连通")}
          className={cn(
            iconButtonClass,
            !onTest && "cursor-not-allowed opacity-40",
          )}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
        </Button>
        {onOpenTerminal && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onOpenTerminal}
            title={t("provider.openTerminal", "打开终端")}
            className={cn(
              iconButtonClass,
              "hover:text-emerald-600 dark:hover:text-emerald-400",
            )}
          >
            <Terminal className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={isCurrent ? undefined : onDelete}
          disabled={isCurrent}
          title={t("common.delete")}
          className={cn(
            iconButtonClass,
            !isCurrent && "hover:text-red-500 dark:hover:text-red-400",
            isCurrent && "cursor-not-allowed opacity-40",
          )}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
