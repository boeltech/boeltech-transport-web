import { Switch } from "@shared/ui/switch";
import { Label } from "@shared/ui/label";
import { Input } from "@shared/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import type { GpsAlertSetting, GpsAlertTypeCode } from "../../domain";
import { monitoringCopy } from "../copy/monitoringCopy";

export interface AlertSettingsCardProps {
  readonly setting: GpsAlertSetting;
  readonly enabled: boolean;
  readonly thresholdValue: number | null;
  readonly onEnabledChange: (enabled: boolean) => void;
  readonly onThresholdChange: (value: number | null) => void;
  readonly disabled?: boolean;
}

export function AlertSettingsCard({
  setting,
  enabled,
  thresholdValue,
  onEnabledChange,
  onThresholdChange,
  disabled = false,
}: AlertSettingsCardProps) {
  const copy = monitoringCopy.alertSettings;
  const typeCopy = copy.types[setting.alertType as GpsAlertTypeCode];
  const unconfigured = setting.status === "unconfigured";
  const showThreshold =
    setting.alertType !== "geofence_exit" && setting.thresholdUnit != null;

  return (
    <Card
      data-testid={`alert-settings-card-${setting.alertType}`}
      className={cn(unconfigured && "opacity-90")}
    >
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            {typeCopy?.title ?? setting.alertType}
            {unconfigured ? (
              <Badge variant="secondary">{copy.unconfigured}</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            {typeCopy?.description ?? ""}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Label
            htmlFor={`alert-enabled-${setting.alertType}`}
            className="text-xs text-muted-foreground"
          >
            {copy.enabledLabel}
          </Label>
          <Switch
            id={`alert-enabled-${setting.alertType}`}
            checked={enabled && !unconfigured}
            disabled={disabled || unconfigured}
            onCheckedChange={onEnabledChange}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {unconfigured ? (
          <p className="text-sm text-muted-foreground">{copy.unconfiguredHint}</p>
        ) : null}
        {showThreshold && !unconfigured ? (
          <div className="flex max-w-xs items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`alert-threshold-${setting.alertType}`}>
                {copy.thresholdLabel}
                {typeCopy?.unit ? ` (${typeCopy.unit})` : ""}
              </Label>
              <Input
                id={`alert-threshold-${setting.alertType}`}
                type="number"
                inputMode="numeric"
                value={thresholdValue ?? ""}
                disabled={disabled || !enabled}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    onThresholdChange(null);
                    return;
                  }
                  const n = Number(raw);
                  onThresholdChange(Number.isFinite(n) ? n : null);
                }}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
