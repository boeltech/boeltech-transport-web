import { cn } from "@shared/lib/utils/cn";
import { platformCopy } from "../copy/platformCopy";
import {
  healthToneDotClass,
  resolvePlatformHealthTone,
} from "../utils/platformHealthTone";

interface TenantHealthDotProps {
  score: number | null | undefined;
  className?: string;
  /** When true, show numeric score next to the dot (or "—" when null). */
  showLabel?: boolean;
}

export function TenantHealthDot({
  score,
  className,
  showLabel = true,
}: TenantHealthDotProps) {
  const tone = resolvePlatformHealthTone(score);
  const label =
    score == null
      ? platformCopy.health.nullLabel
      : platformCopy.health.scoreLabel(score);
  const toneLabel = platformCopy.health.tone[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm tabular-nums",
        className,
      )}
      title={toneLabel}
      aria-label={`${platformCopy.tenants.list.columns.health}: ${label} (${toneLabel})`}
    >
      {score == null ? (
        <span className="text-muted-foreground">{label}</span>
      ) : (
        <>
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
              healthToneDotClass(tone),
            )}
            aria-hidden
          />
          {showLabel ? <span>{label}</span> : null}
        </>
      )}
    </span>
  );
}
