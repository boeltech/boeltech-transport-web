import { useMemo, useState } from "react";
import { SettingsPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Skeleton } from "@shared/ui/skeleton";
import { useToast } from "@shared/hooks";
import {
  useGpsAlertSettings,
  useUpdateGpsAlertSettings,
} from "../../application";
import type {
  GpsAlertSetting,
  GpsAlertSettingsUpdateItem,
  GpsAlertTypeCode,
} from "../../domain";
import { AlertSettingsCard } from "../components/AlertSettingsCard";
import { monitoringCopy } from "../copy/monitoringCopy";

type DraftMap = Record<
  GpsAlertTypeCode,
  { enabled: boolean; thresholdValue: number | null }
>;

function toDraft(settings: GpsAlertSetting[]): DraftMap {
  const draft = {} as DraftMap;
  for (const s of settings) {
    draft[s.alertType] = {
      enabled: s.enabled,
      thresholdValue: s.thresholdValue,
    };
  }
  return draft;
}

export function AlertSettingsPage() {
  const copy = monitoringCopy.alertSettings;
  const { success, error } = useToast();
  const query = useGpsAlertSettings();
  const update = useUpdateGpsAlertSettings({
    onSuccess: () => success(copy.saved),
    onError: (err) => error(err.message || copy.errorGeneric),
  });

  const settings = useMemo(
    () => query.data?.settings ?? [],
    [query.data?.settings],
  );
  const baseline = useMemo(
    () => (settings.length > 0 ? toDraft(settings) : null),
    [settings],
  );
  const [dirty, setDirty] = useState<DraftMap | null>(null);
  const [baselineKey, setBaselineKey] = useState<GpsAlertSetting[] | null>(
    null,
  );

  if (settings !== baselineKey) {
    setBaselineKey(settings);
    setDirty(null);
  }

  const draft = dirty ?? baseline;

  const payload = useMemo((): GpsAlertSettingsUpdateItem[] | null => {
    if (!draft || settings.length === 0) return null;
    return settings.map((s) => ({
      alertType: s.alertType,
      enabled: draft[s.alertType]?.enabled ?? s.enabled,
      thresholdValue:
        draft[s.alertType]?.thresholdValue ?? s.thresholdValue,
    }));
  }, [draft, settings]);

  const handleSave = () => {
    if (!payload) return;
    update.mutate(payload);
  };

  return (
    <SettingsPageShell
      title={copy.title}
      description={copy.description}
      hideSidebar
      headerSlot={
        <Button
          type="button"
          onClick={handleSave}
          disabled={!payload || update.isPending || query.isLoading}
        >
          {update.isPending ? copy.saving : copy.save}
        </Button>
      }
    >
      {query.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : null}

      {query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{copy.loadError}</AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void query.refetch()}
            >
              {copy.retry}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {draft && settings.length > 0 ? (
        <div className="space-y-4" data-testid="alert-settings-list">
          {settings.map((setting) => (
            <AlertSettingsCard
              key={setting.alertType}
              setting={setting}
              enabled={draft[setting.alertType]?.enabled ?? setting.enabled}
              thresholdValue={
                draft[setting.alertType]?.thresholdValue ??
                setting.thresholdValue
              }
              disabled={update.isPending}
              onEnabledChange={(enabled) => {
                setDirty((prev) => {
                  const base = prev ?? draft;
                  return {
                    ...base,
                    [setting.alertType]: {
                      ...base[setting.alertType],
                      enabled,
                    },
                  };
                });
              }}
              onThresholdChange={(thresholdValue) => {
                setDirty((prev) => {
                  const base = prev ?? draft;
                  return {
                    ...base,
                    [setting.alertType]: {
                      ...base[setting.alertType],
                      thresholdValue,
                    },
                  };
                });
              }}
            />
          ))}
        </div>
      ) : null}
    </SettingsPageShell>
  );
}

export default AlertSettingsPage;
