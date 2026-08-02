/**
 * Preview de marketing: narración operación + facturación.
 * Si `product-preview-dashboard` está enabled en el catálogo → imagen;
 * si no → mock CSS (D4/D5: un solo preview por superficie).
 */
import { cn } from "@shared/lib/utils/cn";
import { isCommercialAssetEnabled } from "@shared/commercial/assets/commercialAssets";
import { CommercialImage } from "@shared/ui/commercial";
import { landingCopy } from "./landingCopy";

type LandingProductPreviewProps = {
  className?: string;
};

const PRODUCT_PREVIEW_ID = "product-preview-dashboard" as const;

export function LandingProductPreview({ className }: LandingProductPreviewProps) {
  if (isCommercialAssetEnabled(PRODUCT_PREVIEW_ID)) {
    return (
      <div
        className={cn(
          "pointer-events-none relative mx-auto w-full max-w-5xl select-none",
          className,
        )}
        aria-hidden
      >
        <CommercialImage
          id={PRODUCT_PREVIEW_ID}
          decorative
          loading="eager"
          className={cn(
            "bg-card border-border w-full rounded-2xl border object-cover object-top shadow-xl",
            "translate-y-2 sm:translate-y-4",
          )}
        />
      </div>
    );
  }

  return <LandingProductPreviewMock className={className} />;
}

function LandingProductPreviewMock({ className }: LandingProductPreviewProps) {
  const { preview } = landingCopy;

  return (
    <div
      className={cn(
        "pointer-events-none relative mx-auto w-full max-w-5xl select-none",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "bg-card text-card-foreground border-border relative overflow-hidden rounded-2xl border shadow-xl",
          "translate-y-2 sm:translate-y-4",
        )}
      >
        <div className="bg-muted/70 flex items-center gap-2 border-b px-4 py-2.5">
          <span className="bg-muted-foreground/25 h-2.5 w-2.5 rounded-full" />
          <span className="bg-muted-foreground/25 h-2.5 w-2.5 rounded-full" />
          <span className="bg-muted-foreground/25 h-2.5 w-2.5 rounded-full" />
          <span className="text-muted-foreground ml-2 truncate text-xs">
            {preview.windowTitle}
          </span>
        </div>

        <div className="flex min-h-[220px] sm:min-h-[280px]">
          <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-44 shrink-0 flex-col gap-2.5 border-r p-3 sm:flex">
            <div className="bg-sidebar-primary/25 mb-1 h-8 w-full rounded-lg" />
            {preview.navItems.map((item, i) => (
              <div
                key={item}
                className={cn(
                  "h-2.5 rounded",
                  i === 1
                    ? "bg-sidebar-primary/40 w-full"
                    : "bg-sidebar-foreground/15 w-[85%]",
                )}
              />
            ))}
            <div className="bg-sidebar-foreground/10 mt-auto h-2.5 w-2/3 rounded" />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2">
              {preview.statusStrip.map((item) => (
                <div
                  key={item.label}
                  className="bg-muted/50 rounded-xl border px-3 py-2.5"
                >
                  <p className="text-muted-foreground text-[10px] leading-none sm:text-xs">
                    {item.label}
                  </p>
                  <p className="text-foreground mt-1.5 truncate text-sm font-semibold sm:text-base">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-muted/30 min-h-0 flex-1 rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-foreground text-xs font-semibold sm:text-sm">
                  {preview.panelTitle}
                </p>
                <span className="text-muted-foreground text-[10px]">
                  {preview.panelHint}
                </span>
              </div>
              <ul className="space-y-2">
                {preview.trips.map((trip) => (
                  <li
                    key={trip.code}
                    className="bg-background/90 flex items-center justify-between gap-3 rounded-lg border px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-xs font-medium sm:text-sm">
                        {trip.code}
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {trip.route}
                        </span>
                      </p>
                      <p className="text-muted-foreground mt-0.5 truncate text-[10px] sm:text-xs">
                        {trip.fiscal}
                      </p>
                    </div>
                    <span className="bg-primary/15 text-primary shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium sm:text-xs">
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
