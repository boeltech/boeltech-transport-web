/**
 * Preview visual del producto en el panel de marca (estilo SaasAble).
 * Composición CSS con tokens OKLCH — sin screenshot estático ni colores crudos.
 */
import { cn } from "@shared/lib/utils/cn";
import { authFunnelCopy as copy } from "./authFunnelCopy";

type AuthFunnelProductPreviewProps = {
  className?: string;
  /** compact = bajo el stepper en registro */
  density?: "default" | "compact";
};

export function AuthFunnelProductPreview({
  className,
  density = "default",
}: AuthFunnelProductPreviewProps) {
  const compact = density === "compact";

  return (
    <div
      className={cn(
        "pointer-events-none relative select-none",
        compact ? "mt-auto pt-4" : "mt-auto",
        className,
      )}
      aria-hidden
    >
      <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
        {copy.previewLabel}
      </p>
      <div
        className={cn(
          "bg-card text-card-foreground border-border/80 relative overflow-hidden rounded-xl border shadow-lg",
          "origin-bottom-left",
          compact
            ? "translate-y-2 scale-[0.92]"
            : "translate-x-4 translate-y-6 scale-[1.02] sm:translate-x-6",
        )}
      >
        <div className="bg-muted/80 flex items-center gap-1.5 border-b px-3 py-2">
          <span className="bg-muted-foreground/25 h-2 w-2 rounded-full" />
          <span className="bg-muted-foreground/25 h-2 w-2 rounded-full" />
          <span className="bg-muted-foreground/25 h-2 w-2 rounded-full" />
          <span className="text-muted-foreground ml-2 truncate text-[10px]">
            {copy.previewWindowTitle}
          </span>
        </div>

        <div className={cn("flex", compact ? "h-36" : "h-48")}>
          <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-14 shrink-0 flex-col gap-2 border-r p-2">
            <div className="bg-sidebar-primary/20 h-6 w-full rounded-md" />
            <div className="bg-sidebar-foreground/15 h-2 w-full rounded" />
            <div className="bg-sidebar-foreground/10 h-2 w-3/4 rounded" />
            <div className="bg-sidebar-foreground/10 h-2 w-full rounded" />
            <div className="bg-sidebar-foreground/10 mt-auto h-2 w-2/3 rounded" />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              {[copy.previewKpis[0], copy.previewKpis[1], copy.previewKpis[2]].map(
                (kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-muted/60 rounded-md border px-1.5 py-1"
                  >
                    <p className="text-muted-foreground truncate text-[8px] leading-none">
                      {kpi.label}
                    </p>
                    <p className="text-foreground mt-1 text-[11px] font-semibold leading-none">
                      {kpi.value}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div className="bg-muted/40 min-h-0 flex-1 rounded-md border p-2">
              <p className="text-muted-foreground mb-1.5 text-[9px] font-medium">
                {copy.previewListTitle}
              </p>
              <ul className="space-y-1.5">
                {copy.previewTrips.map((trip) => (
                  <li
                    key={trip.code}
                    className="bg-background/80 flex items-center justify-between gap-2 rounded border px-1.5 py-1"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-[9px] font-medium">
                        {trip.code}
                      </p>
                      <p className="text-muted-foreground truncate text-[8px]">
                        {trip.route}
                      </p>
                    </div>
                    <span className="bg-primary/15 text-primary shrink-0 rounded px-1 py-0.5 text-[8px] font-medium">
                      {trip.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
