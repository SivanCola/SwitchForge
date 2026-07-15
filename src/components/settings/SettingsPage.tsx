import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  Database,
  FlaskConical,
  FolderSearch,
  HardDriveDownload,
  Loader2,
  Save,
  ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { settingsApi } from "@/lib/api";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { WindowSettings } from "@/components/settings/WindowSettings";
import { SkillStorageLocationSettings } from "@/components/settings/SkillStorageLocationSettings";
import { SkillSyncMethodSettings } from "@/components/settings/SkillSyncMethodSettings";
import { TerminalSettings } from "@/components/settings/TerminalSettings";
import { DirectorySettings } from "@/components/settings/DirectorySettings";
import { ImportExportSection } from "@/components/settings/ImportExportSection";
import { BackupListSection } from "@/components/settings/BackupListSection";
import { AboutSection } from "@/components/settings/AboutSection";
import { ConnectivityCheckConfigPanel } from "@/components/settings/ConnectivityCheckConfigPanel";
import { LogConfigPanel } from "@/components/settings/LogConfigPanel";
import { useInstalledSkills } from "@/hooks/useSkills";
import { useSettings } from "@/hooks/useSettings";
import { useImportExport } from "@/hooks/useImportExport";
import { useTranslation } from "react-i18next";
import type { SettingsFormState } from "@/hooks/useSettings";

interface SettingsPageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void | Promise<void>;
  defaultTab?: string;
}

const SETTINGS_TABS = new Set(["general", "advanced", "about"]);

export function SettingsPage({
  open,
  onOpenChange,
  onImportSuccess,
  defaultTab = "general",
}: SettingsPageProps) {
  const { t } = useTranslation();
  const {
    settings,
    isLoading,
    isSaving,
    isPortable,
    appConfigDir,
    resolvedDirs,
    updateSettings,
    updateDirectory,
    updateAppConfigDir,
    browseDirectory,
    browseAppConfigDir,
    resetDirectory,
    resetAppConfigDir,
    saveSettings,
    autoSaveSettings,
    requiresRestart,
    acknowledgeRestart,
  } = useSettings();
  const {
    selectedFile,
    status: importStatus,
    errorMessage,
    backupId,
    isImporting,
    selectImportFile,
    importConfig,
    exportConfig,
    clearSelection,
    resetStatus,
  } = useImportExport({ onImportSuccess });
  const { data: installedSkills } = useInstalledSkills();
  const [activeTab, setActiveTab] = useState("general");
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const tabScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setActiveTab(SETTINGS_TABS.has(defaultTab) ? defaultTab : "general");
    resetStatus();
  }, [defaultTab, open, resetStatus]);

  useEffect(() => {
    if (requiresRestart) setShowRestartPrompt(true);
  }, [requiresRestart]);

  useLayoutEffect(() => {
    if (tabScrollContainerRef.current) {
      tabScrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const closeAfterSave = useCallback(() => {
    acknowledgeRestart();
    clearSelection();
    resetStatus();
    onOpenChange(false);
  }, [acknowledgeRestart, clearSelection, onOpenChange, resetStatus]);

  const handleSave = useCallback(async () => {
    try {
      const result = await saveSettings(undefined, { silent: false });
      if (!result) return;
      if (result.requiresRestart) {
        setShowRestartPrompt(true);
        return;
      }
      closeAfterSave();
    } catch (error) {
      console.error("[SettingsPage] Failed to save settings", error);
    }
  }, [closeAfterSave, saveSettings]);

  const handleRestartLater = useCallback(() => {
    setShowRestartPrompt(false);
    closeAfterSave();
  }, [closeAfterSave]);

  const handleRestartNow = useCallback(async () => {
    setShowRestartPrompt(false);
    if (import.meta.env.DEV) {
      toast.success(t("settings.devModeRestartHint"), { closeButton: true });
      closeAfterSave();
      return;
    }
    try {
      await settingsApi.restart();
    } catch (error) {
      console.error("[SettingsPage] Failed to restart app", error);
      toast.error(t("settings.restartFailed"));
    } finally {
      closeAfterSave();
    }
  }, [closeAfterSave, t]);

  const handleAutoSave = useCallback(
    async (updates: Partial<SettingsFormState>): Promise<boolean> => {
      if (!settings) return false;
      const previousValues = Object.fromEntries(
        Object.keys(updates).map((key) => [
          key,
          settings[key as keyof SettingsFormState],
        ]),
      ) as Partial<SettingsFormState>;
      updateSettings(updates);
      try {
        await autoSaveSettings(updates);
        return true;
      } catch (error) {
        console.error("[SettingsPage] Failed to autosave settings", error);
        updateSettings(previousValues);
        toast.error(
          t("settings.saveFailedGeneric", {
            defaultValue: "保存失败，请重试",
          }),
        );
        return false;
      }
    },
    [autoSaveSettings, settings, t, updateSettings],
  );

  const isBusy = useMemo(() => isLoading && !settings, [isLoading, settings]);

  return (
    <div className="flex h-full flex-col overflow-hidden px-6">
      {isBusy ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full flex-col"
        >
          <TabsList className="glass mb-6 grid w-full grid-cols-3 rounded-lg">
            <TabsTrigger value="general">
              {t("settings.tabGeneral")}
            </TabsTrigger>
            <TabsTrigger value="advanced">
              {t("settings.tabAdvanced")}
            </TabsTrigger>
            <TabsTrigger value="about">{t("common.about")}</TabsTrigger>
          </TabsList>

          <div className="flex min-h-0 flex-1 flex-col">
            <div
              ref={tabScrollContainerRef}
              className="flex-1 overflow-x-hidden overflow-y-auto pr-2"
            >
              <TabsContent value="general" className="mt-0 space-y-6">
                {settings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <LanguageSettings
                      value={settings.language}
                      onChange={(language) => handleAutoSave({ language })}
                    />
                    <ThemeSettings />
                    <SkillStorageLocationSettings
                      value={settings.skillStorageLocation ?? "switchforge"}
                      installedCount={installedSkills?.length ?? 0}
                      onMigrated={(skillStorageLocation) =>
                        updateSettings({ skillStorageLocation })
                      }
                    />
                    <SkillSyncMethodSettings
                      value={settings.skillSyncMethod ?? "auto"}
                      onChange={(skillSyncMethod) =>
                        handleAutoSave({ skillSyncMethod })
                      }
                    />
                    <WindowSettings
                      settings={settings}
                      onChange={handleAutoSave}
                    />
                    <TerminalSettings
                      value={settings.preferredTerminal}
                      onChange={(preferredTerminal) =>
                        handleAutoSave({ preferredTerminal })
                      }
                    />
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 space-y-6 pb-4">
                {settings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Accordion
                      type="multiple"
                      className="w-full space-y-4"
                      defaultValue={[]}
                    >
                      <SettingsAccordionItem
                        value="directory"
                        icon={FolderSearch}
                        iconClass="text-primary"
                        title={t("settings.advanced.configDir.title")}
                        description={t(
                          "settings.advanced.configDir.description",
                        )}
                      >
                        <DirectorySettings
                          appConfigDir={appConfigDir}
                          resolvedDirs={resolvedDirs}
                          onAppConfigChange={updateAppConfigDir}
                          onBrowseAppConfig={browseAppConfigDir}
                          onResetAppConfig={resetAppConfigDir}
                          claudeDir={settings.claudeConfigDir}
                          codexDir={settings.codexConfigDir}
                          onDirectoryChange={updateDirectory}
                          onBrowseDirectory={browseDirectory}
                          onResetDirectory={resetDirectory}
                        />
                      </SettingsAccordionItem>

                      <SettingsAccordionItem
                        value="data"
                        icon={Database}
                        iconClass="text-blue-500"
                        title={t("settings.advanced.data.title")}
                        description={t("settings.advanced.data.description")}
                      >
                        <ImportExportSection
                          status={importStatus}
                          selectedFile={selectedFile}
                          errorMessage={errorMessage}
                          backupId={backupId}
                          isImporting={isImporting}
                          onSelectFile={selectImportFile}
                          onImport={importConfig}
                          onExport={exportConfig}
                          onClear={clearSelection}
                        />
                      </SettingsAccordionItem>

                      <SettingsAccordionItem
                        value="backup"
                        icon={HardDriveDownload}
                        iconClass="text-amber-500"
                        title={t("settings.advanced.backup.title", {
                          defaultValue: "Backup & Restore",
                        })}
                        description={t("settings.advanced.backup.description", {
                          defaultValue:
                            "Manage local database backups and restore points",
                        })}
                      >
                        <BackupListSection
                          backupIntervalHours={settings.backupIntervalHours}
                          backupRetainCount={settings.backupRetainCount}
                          onSettingsChange={handleAutoSave}
                        />
                      </SettingsAccordionItem>

                      <SettingsAccordionItem
                        value="connectivity"
                        icon={FlaskConical}
                        iconClass="text-emerald-500"
                        title={t("settings.advanced.connectivityCheck.title")}
                        description={t(
                          "settings.advanced.connectivityCheck.description",
                        )}
                      >
                        <ConnectivityCheckConfigPanel />
                      </SettingsAccordionItem>

                      <SettingsAccordionItem
                        value="logs"
                        icon={ScrollText}
                        iconClass="text-cyan-500"
                        title={t("settings.advanced.logConfig.title")}
                        description={t(
                          "settings.advanced.logConfig.description",
                        )}
                      >
                        <LogConfigPanel />
                      </SettingsAccordionItem>
                    </Accordion>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="about" className="mt-0">
                <AboutSection isPortable={isPortable} />
              </TabsContent>
            </div>

            {activeTab === "advanced" && settings && (
              <div className="shrink-0 border-t border-border-default pt-4">
                <div className="flex items-center justify-end gap-3 px-6">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? t("settings.saving") : t("common.save")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Tabs>
      )}

      <Dialog
        open={showRestartPrompt}
        onOpenChange={(isOpen) => !isOpen && handleRestartLater()}
      >
        <DialogContent zIndex="alert" className="glass max-w-md border-border">
          <DialogHeader>
            <DialogTitle>{t("settings.restartRequired")}</DialogTitle>
          </DialogHeader>
          <div className="px-6 text-sm text-muted-foreground">
            {t("settings.restartRequiredMessage")}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleRestartLater}>
              {t("settings.restartLater")}
            </Button>
            <Button onClick={handleRestartNow}>
              {t("settings.restartNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SettingsAccordionItemProps {
  value: string;
  icon: typeof Database;
  iconClass: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsAccordionItem({
  value,
  icon: Icon,
  iconClass,
  title,
  description,
  children,
}: SettingsAccordionItemProps) {
  return (
    <AccordionItem
      value={value}
      className="glass-card overflow-hidden rounded-xl"
    >
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 hover:no-underline data-[state=open]:bg-muted/50">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${iconClass}`} />
          <div className="text-left">
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm font-normal text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="border-t border-border/50 px-6 pb-6 pt-4">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
