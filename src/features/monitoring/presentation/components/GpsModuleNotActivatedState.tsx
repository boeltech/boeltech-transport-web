import { Radio } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { EmptyState } from "@shared/ui/feedback-states";
import { monitoringCopy } from "../copy/monitoringCopy";

export type GpsModuleNotActivatedVariant = "map" | "page";

export interface GpsModuleNotActivatedStateProps {
  readonly variant?: GpsModuleNotActivatedVariant;
  readonly className?: string;
}

/**
 * Empty operativo sin CTA de compra / precios (F4 piloto).
 */
export function GpsModuleNotActivatedState({
  variant = "page",
  className,
}: GpsModuleNotActivatedStateProps) {
  const copy = monitoringCopy.moduleGate;

  if (variant === "map") {
    return (
      <div
        className={cn(
          "absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/55 px-6 backdrop-blur-[2px]",
          className,
        )}
        data-testid="gps-module-not-activated"
      >
        <div
          className={cn(
            "max-w-md rounded-2xl border border-white/10 bg-zinc-950/90 p-8 text-center shadow-2xl",
            "text-zinc-100",
          )}
        >
          <Radio className="mx-auto h-10 w-10 text-zinc-400" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">{copy.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="gps-module-not-activated" className={className}>
      <EmptyState
        icon={<Radio className="h-8 w-8" />}
        title={copy.title}
        description={copy.description}
      />
    </div>
  );
}
