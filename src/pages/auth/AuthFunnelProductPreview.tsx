/**
 * Preview de marketing del embudo auth: operación + facturación.
 * Mismo asset que landing (`product-preview-dashboard`); mock CSS si no enabled.
 */
import { cn } from "@shared/lib/utils/cn";
import { isCommercialAssetEnabled } from "@shared/commercial/assets/commercialAssets";
import { CommercialImage } from "@shared/ui/commercial";
import { authFunnelCopy as copy } from "./authFunnelCopy";

type AuthFunnelProductPreviewProps = {
  className?: string;
  /** compact = login / bajo el stepper en registro */
  density?: "default" | "compact";
};

const PRODUCT_PREVIEW_ID = "product-preview-dashboard" as const;

export function AuthFunnelProductPreview({
  className,
  density = "default",
}: AuthFunnelProductPreviewProps) {
  const compact = density === "compact";

  if (isCommercialAssetEnabled(PRODUCT_PREVIEW_ID)) {
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
        <CommercialImage
          id={PRODUCT_PREVIEW_ID}
          decorative
          className={cn(
            "border-border/80 w-full rounded-xl border object-cover object-top shadow-lg",
            "origin-bottom-left",
            compact
              ? "translate-y-2 scale-[0.92]"
              : "translate-x-4 translate-y-6 scale-[1.02] sm:translate-x-6",
            compact ? "max-h-36" : "max-h-48",
          )}
        />
      </div>
    );
  }

  return (
    <AuthFunnelProductPreviewMock className={className} density={density} />
  );
}

function AuthFunnelProductPreviewMock({
  className,
  density = "default",
}: AuthFunnelProductPreviewProps) {
  const compact = density === "compact";
  const trips = compact ? copy.previewTrips.slice(0, 2) : copy.previewTrips;

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
            <div className="bg-sidebar-primary/35 h-2 w-full rounded" />
            <div className="bg-sidebar-foreground/10 h-2 w-3/4 rounded" />
            <div className="bg-sidebar-foreground/10 h-2 w-full rounded" />
            <div className="bg-sidebar-foreground/10 mt-auto h-2 w-2/3 rounded" />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5">
            <div className="grid grid-cols-2 gap-1.5">
              {copy.previewStatusStrip.map((item) => (
                <div
                  key={item.label}
                  className="bg-muted/60 rounded-md border px-1.5 py-1"
                >
                  <p className="text-muted-foreground truncate text-[8px] leading-none">
                    {item.label}
                  </p>
                  <p className="text-foreground mt-1 truncate text-[11px] font-semibold leading-none">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-muted/40 min-h-0 flex-1 rounded-md border p-2">
              <p className="text-muted-foreground mb-1.5 text-[9px] font-medium">
                {copy.previewListTitle}
              </p>
              <ul className="space-y-1.5">
                {trips.map((trip) => (
                  <li
                    key={trip.code}
                    className="bg-background/80 flex items-center justify-between gap-2 rounded border px-1.5 py-1"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-[9px] font-medium">
                        {trip.code}
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {trip.route}
                        </span>
                      </p>
                      <p className="text-muted-foreground truncate text-[8px]">
                        {trip.fiscal}
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
