import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getConnectivityCheckConfig,
  saveConnectivityCheckConfig,
  type ConnectivityCheckConfig,
} from "@/lib/api/connectivity";

export function ConnectivityCheckConfigPanel() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    timeoutSecs: "8",
    maxRetries: "1",
    degradedThresholdMs: "6000",
  });

  useEffect(() => {
    void loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getConnectivityCheckConfig();
      setConfig({
        timeoutSecs: String(data.timeoutSecs),
        maxRetries: String(data.maxRetries),
        degradedThresholdMs: String(data.degradedThresholdMs),
      });
    } catch (loadError) {
      setError(String(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    const parseNumber = (value: string, fallback: number) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    try {
      setIsSaving(true);
      const parsed: ConnectivityCheckConfig = {
        timeoutSecs: parseNumber(config.timeoutSecs, 8),
        maxRetries: parseNumber(config.maxRetries, 1),
        degradedThresholdMs: parseNumber(config.degradedThresholdMs, 6000),
      };
      await saveConnectivityCheckConfig(parsed);
      toast.success(t("connectivityCheck.configSaved"), { closeButton: true });
    } catch (saveError) {
      toast.error(
        `${t("connectivityCheck.configSaveFailed")}: ${String(saveError)}`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("connectivityCheck.connectivityNote")}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          {t("connectivityCheck.checkParams")}
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="timeoutSecs">
              {t("connectivityCheck.timeout")}
            </Label>
            <Input
              id="timeoutSecs"
              type="number"
              min={2}
              max={60}
              value={config.timeoutSecs}
              onChange={(event) =>
                setConfig({ ...config, timeoutSecs: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRetries">
              {t("connectivityCheck.maxRetries")}
            </Label>
            <Input
              id="maxRetries"
              type="number"
              min={0}
              max={5}
              value={config.maxRetries}
              onChange={(event) =>
                setConfig({ ...config, maxRetries: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="degradedThresholdMs">
              {t("connectivityCheck.degradedThreshold")}
            </Label>
            <Input
              id="degradedThresholdMs"
              type="number"
              min={1000}
              max={30000}
              step={1000}
              value={config.degradedThresholdMs}
              onChange={(event) =>
                setConfig({
                  ...config,
                  degradedThresholdMs: event.target.value,
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
