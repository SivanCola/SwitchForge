import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FolderArchive,
  History,
  Maximize2,
  Minimize2,
  Plus,
  Server,
  Settings,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
import type { Provider } from "@/types";
import type { EnvConflict } from "@/types/env";
import type { ProviderSwitchEvent } from "@/lib/api";
import type { SupportedAppId } from "@/config/appRegistry";
import { providersApi, settingsApi } from "@/lib/api";
import { useProvidersQuery, useSettingsQuery } from "@/lib/query/queries";
import { checkAllEnvConflicts, checkEnvConflicts } from "@/lib/api/env";
import { useProviderActions } from "@/hooks/useProviderActions";
import { extractErrorMessage } from "@/utils/errorUtils";
import { isTextEditableTarget } from "@/utils/domUtils";
import { deepClone } from "@/utils/deepClone";
import { isSupportedAppId } from "@/config/appRegistry";
import {
  isLinux,
  isWindows,
  DRAG_REGION_ATTR,
  DRAG_REGION_STYLE,
} from "@/lib/platform";
import { AppSwitcher } from "@/components/AppSwitcher";
import { ProviderList } from "@/components/providers/ProviderList";
import { AddProviderDialog } from "@/components/providers/AddProviderDialog";
import { EditProviderDialog } from "@/components/providers/EditProviderDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { UpdateBadge } from "@/components/UpdateBadge";
import { EnvWarningBanner } from "@/components/env/EnvWarningBanner";
import UnifiedMcpPanel, {
  type UnifiedMcpPanelHandle,
} from "@/components/mcp/UnifiedMcpPanel";
import UnifiedSkillsPanel, {
  type UnifiedSkillsPanelHandle,
} from "@/components/skills/UnifiedSkillsPanel";
import { FirstRunNoticeDialog } from "@/components/FirstRunNoticeDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type View = "providers" | "mcp" | "skills" | "settings";

const DEFAULT_DRAG_BAR_HEIGHT = isWindows() || isLinux() ? 0 : 28;
const HEADER_HEIGHT = 64;
const APP_STORAGE_KEY = "switchforge:last-app";
const VIEW_STORAGE_KEY = "switchforge:last-view";
const VALID_VIEWS: readonly View[] = ["providers", "mcp", "skills", "settings"];

const getInitialApp = (): SupportedAppId => {
  const saved = localStorage.getItem(APP_STORAGE_KEY);
  return isSupportedAppId(saved) ? saved : "claude";
};

const getInitialView = (): View => {
  const saved = localStorage.getItem(VIEW_STORAGE_KEY);
  return VALID_VIEWS.includes(saved as View) ? (saved as View) : "providers";
};

function App() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeApp, setActiveApp] = useState<SupportedAppId>(getInitialApp);
  const [currentView, setCurrentView] = useState<View>(getInitialView);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState("general");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(
    null,
  );
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [envConflicts, setEnvConflicts] = useState<EnvConflict[]>([]);
  const [showEnvBanner, setShowEnvBanner] = useState(false);
  const mcpPanelRef = useRef<UnifiedMcpPanelHandle>(null);
  const skillsPanelRef = useRef<UnifiedSkillsPanelHandle>(null);

  const { data: settingsData } = useSettingsQuery();
  const useAppWindowControls =
    isLinux() && (settingsData?.useAppWindowControls ?? false);
  const dragBarHeight = useAppWindowControls ? 32 : DEFAULT_DRAG_BAR_HEIGHT;
  const contentTopOffset = dragBarHeight + HEADER_HEIGHT;

  const { data, isLoading, refetch } = useProvidersQuery(activeApp);
  const providers = useMemo(() => data?.providers ?? {}, [data]);
  const currentProviderId = data?.currentProviderId ?? "";
  const { addProvider, updateProvider, switchProvider, deleteProvider } =
    useProviderActions(activeApp);

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, currentView);
  }, [currentView]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;

    void providersApi
      .onSwitched(async (event: ProviderSwitchEvent) => {
        if (event.appType === activeApp) await refetch();
      })
      .then((off) => {
        if (active) unsubscribe = off;
        else off();
      })
      .catch((error) => {
        console.error("[App] Failed to subscribe provider switch event", error);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [activeApp, refetch]);

  useEffect(() => {
    let active = true;
    let unlistenResize: (() => void) | undefined;

    const syncWindowState = async () => {
      try {
        const currentWindow = getCurrentWindow();
        const refresh = async () => {
          const maximized = await currentWindow.isMaximized();
          if (active) setIsWindowMaximized(maximized);
        };
        await refresh();
        unlistenResize = await currentWindow.onResized(() => void refresh());
      } catch (error) {
        console.error("[App] Failed to sync window maximized state", error);
      }
    };

    void syncWindowState();
    return () => {
      active = false;
      unlistenResize?.();
    };
  }, []);

  useEffect(() => {
    if (!settingsData) return;
    const syncWindowDecorations = async () => {
      try {
        await getCurrentWindow().setDecorations(!useAppWindowControls);
      } catch (error) {
        console.error("[App] Failed to update window decorations", error);
      }
    };
    void syncWindowDecorations();
  }, [settingsData, useAppWindowControls]);

  useEffect(() => {
    const loadConflicts = async () => {
      try {
        const allConflicts = await checkAllEnvConflicts();
        const conflicts = Object.values(allConflicts).flat();
        setEnvConflicts(conflicts);
        if (
          conflicts.length > 0 &&
          !sessionStorage.getItem("switchforge:env-banner-dismissed")
        ) {
          setShowEnvBanner(true);
        }
      } catch (error) {
        console.error("[App] Failed to check environment conflicts", error);
      }
    };
    void loadConflicts();
  }, []);

  useEffect(() => {
    void checkEnvConflicts(activeApp)
      .then((conflicts) => {
        if (conflicts.length === 0) return;
        setEnvConflicts((current) => {
          const existing = new Set(
            current.map((item) => `${item.varName}:${item.sourcePath}`),
          );
          return [
            ...current,
            ...conflicts.filter(
              (item) => !existing.has(`${item.varName}:${item.sourcePath}`),
            ),
          ];
        });
        if (!sessionStorage.getItem("switchforge:env-banner-dismissed")) {
          setShowEnvBanner(true);
        }
      })
      .catch((error) => {
        console.error("[App] Failed to check app environment", error);
      });
  }, [activeApp]);

  useEffect(() => {
    void invoke<boolean>("get_migration_result")
      .then((migrated) => {
        if (migrated) {
          toast.success(
            t("migration.success", { defaultValue: "配置迁移成功" }),
          );
        }
      })
      .catch((error) => {
        console.error("[App] Failed to read migration result", error);
      });
  }, [t]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "," && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSettingsDefaultTab("general");
        setCurrentView("settings");
        return;
      }
      if (
        event.key === "Escape" &&
        currentView !== "providers" &&
        !event.defaultPrevented &&
        document.body.style.overflow !== "hidden" &&
        !isTextEditableTarget(event.target)
      ) {
        event.preventDefault();
        setCurrentView("providers");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentView]);

  const handleEditProvider = async ({ provider }: { provider: Provider }) => {
    await updateProvider(provider);
    setEditingProvider(null);
  };

  const handleDuplicateProvider = async (provider: Provider) => {
    const newSortIndex =
      provider.sortIndex === undefined ? undefined : provider.sortIndex + 1;
    if (newSortIndex !== undefined) {
      const updates = Object.values(providers)
        .filter(
          (item) =>
            item.id !== provider.id &&
            item.sortIndex !== undefined &&
            item.sortIndex >= newSortIndex,
        )
        .map((item) => ({ id: item.id, sortIndex: item.sortIndex! + 1 }));
      if (updates.length > 0) {
        await providersApi.updateSortOrder(updates, activeApp);
      }
    }

    await addProvider({
      name: `${provider.name} copy`,
      settingsConfig: deepClone(provider.settingsConfig),
      websiteUrl: provider.websiteUrl,
      notes: provider.notes,
      category: provider.category,
      sortIndex: newSortIndex,
      meta: provider.meta ? deepClone(provider.meta) : undefined,
      icon: provider.icon,
      iconColor: provider.iconColor,
    });
  };

  const handleOpenWebsite = async (url: string) => {
    try {
      await settingsApi.openExternal(url);
    } catch (error) {
      toast.error(
        extractErrorMessage(error) ||
          t("notifications.openLinkFailed", {
            defaultValue: "链接打开失败",
          }),
      );
    }
  };

  const handleOpenTerminal = async (provider: Provider) => {
    try {
      const cwd = await settingsApi.pickDirectory();
      if (!cwd) return;
      await providersApi.openTerminal(provider.id, activeApp, { cwd });
      toast.success(
        t("provider.terminalOpened", { defaultValue: "终端已打开" }),
      );
    } catch (error) {
      toast.error(
        `${t("provider.terminalOpenFailed", { defaultValue: "打开终端失败" })}: ${extractErrorMessage(error)}`,
      );
    }
  };

  const handleImportSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["providers"] });
    await refetch();
    await providersApi.updateTrayMenu().catch((error) => {
      console.error("[App] Failed to refresh tray menu", error);
    });
  };

  const notifyWindowControlError = (error: unknown) => {
    toast.error(
      t("notifications.windowControlFailed", {
        defaultValue: "窗口控制失败：{{error}}",
        error: extractErrorMessage(error),
      }),
    );
  };

  const navItems: Array<{
    id: View;
    label: string;
    icon: typeof SlidersHorizontal;
  }> = [
    {
      id: "providers",
      label: t("provider.title", { defaultValue: "Providers" }),
      icon: SlidersHorizontal,
    },
    { id: "mcp", label: t("mcp.title", { defaultValue: "MCP" }), icon: Server },
    {
      id: "skills",
      label: t("skills.title", { defaultValue: "Skills" }),
      icon: Wrench,
    },
    {
      id: "settings",
      label: t("settings.title", { defaultValue: "Settings" }),
      icon: Settings,
    },
  ];

  const renderContent = () => {
    if (currentView === "settings") {
      return (
        <SettingsPage
          open
          onOpenChange={() => setCurrentView("providers")}
          onImportSuccess={handleImportSuccess}
          defaultTab={settingsDefaultTab}
        />
      );
    }
    if (currentView === "mcp") {
      return (
        <UnifiedMcpPanel
          ref={mcpPanelRef}
          onOpenChange={() => setCurrentView("providers")}
        />
      );
    }
    if (currentView === "skills") {
      return <UnifiedSkillsPanel ref={skillsPanelRef} currentApp={activeApp} />;
    }
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6">
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeApp}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <ProviderList
                providers={providers}
                currentProviderId={currentProviderId}
                appId={activeApp}
                isLoading={isLoading}
                onSwitch={switchProvider}
                onEdit={setEditingProvider}
                onDelete={setDeletingProvider}
                onDuplicate={handleDuplicateProvider}
                onOpenWebsite={handleOpenWebsite}
                onOpenTerminal={handleOpenTerminal}
                onCreate={() => setIsAddOpen(true)}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-background pb-4 text-foreground selection:bg-primary/30"
      style={{ overflowX: "hidden", paddingTop: contentTopOffset }}
    >
      {(dragBarHeight > 0 || useAppWindowControls) && (
        <div
          className="fixed left-0 right-0 top-0 z-[70] flex items-center justify-end px-2"
          data-tauri-drag-region
          style={{ WebkitAppRegion: "drag", height: dragBarHeight } as any}
        >
          {useAppWindowControls && (
            <div
              className="flex items-center gap-1"
              style={{ WebkitAppRegion: "no-drag" } as any}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={t("header.windowMinimize")}
                onClick={() =>
                  void getCurrentWindow()
                    .minimize()
                    .catch(notifyWindowControlError)
                }
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={
                  isWindowMaximized
                    ? t("header.windowRestore")
                    : t("header.windowMaximize")
                }
                onClick={() =>
                  void (async () => {
                    try {
                      const currentWindow = getCurrentWindow();
                      await currentWindow.toggleMaximize();
                      setIsWindowMaximized(await currentWindow.isMaximized());
                    } catch (error) {
                      notifyWindowControlError(error);
                    }
                  })()
                }
              >
                {isWindowMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-red-500/15 hover:text-red-500"
                title={t("header.windowClose")}
                onClick={() =>
                  void getCurrentWindow()
                    .close()
                    .catch(notifyWindowControlError)
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {showEnvBanner && envConflicts.length > 0 && (
        <EnvWarningBanner
          conflicts={envConflicts}
          onDismiss={() => {
            setShowEnvBanner(false);
            sessionStorage.setItem("switchforge:env-banner-dismissed", "true");
          }}
          onDeleted={async () => {
            const allConflicts = await checkAllEnvConflicts();
            const conflicts = Object.values(allConflicts).flat();
            setEnvConflicts(conflicts);
            if (conflicts.length === 0) setShowEnvBanner(false);
          }}
        />
      )}

      <header
        className="fixed z-50 w-full bg-background/80 backdrop-blur-md"
        {...DRAG_REGION_ATTR}
        style={
          {
            ...DRAG_REGION_STYLE,
            top: dragBarHeight,
            height: HEADER_HEIGHT,
          } as any
        }
      >
        <div
          className="flex h-full items-center gap-3 px-6"
          {...DRAG_REGION_ATTR}
          style={{ ...DRAG_REGION_STYLE } as any}
        >
          <div
            className="flex shrink-0 items-center gap-2"
            style={{ WebkitAppRegion: "no-drag" } as any}
          >
            <a
              href="https://github.com/SivanCola/SwitchForge"
              target="_blank"
              rel="noreferrer"
              className="text-xl font-semibold text-orange-500 transition-colors hover:text-orange-600 dark:text-orange-400"
            >
              SwitchForge
            </a>
            <UpdateBadge
              onClick={() => {
                setSettingsDefaultTab("about");
                setCurrentView("settings");
              }}
            />
          </div>

          <nav
            aria-label="SwitchForge"
            className="mx-auto flex items-center gap-1 rounded-xl bg-muted p-1"
            style={{ WebkitAppRegion: "no-drag" } as any}
          >
            {navItems.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                size="sm"
                aria-current={currentView === id ? "page" : undefined}
                className={cn(
                  "gap-1.5 px-3",
                  currentView === id &&
                    "bg-background text-foreground shadow-sm",
                )}
                onClick={() => {
                  if (id === "settings") setSettingsDefaultTab("general");
                  setCurrentView(id);
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </nav>

          <div
            className="flex min-w-0 shrink-0 items-center justify-end gap-1.5"
            style={{ WebkitAppRegion: "no-drag" } as any}
          >
            {currentView === "providers" && (
              <>
                <AppSwitcher activeApp={activeApp} onSwitch={setActiveApp} />
                <Button
                  size="icon"
                  className="ml-1 h-8 w-8 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
                  onClick={() => setIsAddOpen(true)}
                  title={t("provider.add", { defaultValue: "Add provider" })}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </>
            )}
            {currentView === "mcp" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => mcpPanelRef.current?.openImport()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("mcp.importExisting")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => mcpPanelRef.current?.openAdd()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("mcp.addMcp")}
                </Button>
              </>
            )}
            {currentView === "skills" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    skillsPanelRef.current?.openRestoreFromBackup()
                  }
                >
                  <History className="mr-2 h-4 w-4" />
                  {t("skills.restoreFromBackup.button")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skillsPanelRef.current?.openInstallFromZip()}
                >
                  <FolderArchive className="mr-2 h-4 w-4" />
                  {t("skills.installFromZip.button")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skillsPanelRef.current?.openImport()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("skills.import")}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto animate-fade-in">
        {renderContent()}
      </main>

      <AddProviderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        appId={activeApp}
        onSubmit={addProvider}
      />
      <EditProviderDialog
        open={Boolean(editingProvider)}
        provider={editingProvider}
        onOpenChange={(open) => !open && setEditingProvider(null)}
        onSubmit={handleEditProvider}
        appId={activeApp}
      />
      <ConfirmDialog
        isOpen={Boolean(deletingProvider)}
        title={t("confirm.deleteProvider")}
        message={
          deletingProvider
            ? t("confirm.deleteProviderMessage", {
                name: deletingProvider.name,
              })
            : ""
        }
        onConfirm={() =>
          void (async () => {
            if (!deletingProvider) return;
            await deleteProvider(deletingProvider.id);
            setDeletingProvider(null);
          })()
        }
        onCancel={() => setDeletingProvider(null)}
      />
      <FirstRunNoticeDialog />
    </div>
  );
}

export default App;
