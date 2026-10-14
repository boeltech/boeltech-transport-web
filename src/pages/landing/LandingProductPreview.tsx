/**
 * Preview de marketing: narración operación + facturación.
 * Frame patio (F2). Montaje hacia/junto al hero en LandingPage.
 * Si `product-preview-dashboard` está enabled → imagen; si no → mock CSS.
 * `backdrop={false}` cuando el hero ya aporta capas.
 */
import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";
import { isCommercialAssetEnabled } from "@shared/commercial/assets/commercialAssets";
import { CommercialImage } from "@shared/ui/commercial";
import { landingCopy } from "./landingCopy";

type LandingProductPreviewProps = {
  className?: string;
  /** Route-mesh detrás del frame. Default false en hero patio. */
  backdrop?: boolean;
  /** Índice en preview.navItems a resaltar (beats de evidencia). */
  activeNavIndex?: number;
};

const PRODUCT_PREVIEW_ID = "product-preview-dashboard" as const;
const ROUTE_MESH_SRC = "/brand/tlama-landing-route-mesh.svg";

export function LandingProductPreview({
  className,
  backdrop = false,
  activeNavIndex = 1,
}: LandingProductPreviewProps) {
  if (isCommercialAssetEnabled(PRODUCT_PREVIEW_ID)) {
    return (
      <PreviewShell className={className} backdrop={backdrop}>
        <CommercialImage
          id={PRODUCT_PREVIEW_ID}
          decorative
          loading="eager"
          className="w-full rounded-xl object-cover object-top"
        />
      </PreviewShell>
    );
  }

  return (
    <PreviewShell className={className} backdrop={backdrop}>
      <LandingProductPreviewMock activeNavIndex={activeNavIndex} />
    </PreviewShell>
  );
}

function PreviewShell({
  className,
  children,
  backdrop,
}: {
  className?: string;
  children: ReactNode;
  backdrop: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none relative mx-auto w-full max-w-5xl select-none",
        className,
      )}
      aria-hidden
    >
      {backdrop ? (
        <img
          src={ROUTE_MESH_SRC}
          alt=""
          width={960}
          height={420}
          decoding="async"
          className="pointer-events-none absolute -top-6 left-1/2 z-0 w-[115%] max-w-none -translate-x-1/2 opacity-40 sm:-top-10 sm:w-[108%]"
        />
      ) : null}
      <div className="landing-preview-frame relative z-10 overflow-hidden rounded-xl">
        {children}
      </div>
    </div>
  );
}

function LandingProductPreviewMock({
  activeNavIndex,
}: {
  activeNavIndex: number;
}) {
  const { preview } = landingCopy;

  return (
    <div className="landing-preview-mock">
      <div className="landing-preview-chrome">
        <span className="landing-preview-dot" />
        <span className="landing-preview-dot" />
        <span className="landing-preview-dot" />
        <span className="landing-preview-window-title">
          {preview.windowTitle}
        </span>
      </div>

      <div className="flex min-h-[220px] sm:min-h-[280px]">
        <aside className="border-r border-[color:var(--landing-hairline)] bg-[color:var(--landing-ink)] text-[color:var(--landing-on-dark)] hidden w-40 shrink-0 flex-col gap-2.5 p-3 sm:flex">
          <div className="mb-1 h-7 w-full rounded bg-[color:var(--landing-brand)]/40" />
          {preview.navItems.map((item, i) => (
            <div
              key={item}
              className={cn(
                "h-2 rounded",
                i === activeNavIndex
                  ? "w-full bg-[color:var(--landing-amber)]/50"
                  : "w-[85%] bg-white/15",
              )}
            />
          ))}
          <div className="mt-auto h-2 w-2/3 rounded bg-white/10" />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2">
            {preview.statusStrip.map((item) => (
              <div key={item.label} className="landing-preview-status">
                <p className="landing-preview-status-label">{item.label}</p>
                <p className="landing-mono mt-1.5 truncate text-sm font-medium sm:text-base">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 rounded-lg border border-[color:var(--landing-hairline)] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold tracking-tight sm:text-sm">
                {preview.panelTitle}
              </p>
              <span className="landing-mono text-[10px] text-[color:var(--landing-muted)]">
                {preview.panelHint}
              </span>
            </div>
            <ul className="space-y-2">
              {preview.trips.map((trip) => (
                <li
                  key={trip.code}
                  className="flex items-center justify-between gap-3 rounded-md border border-[color:var(--landing-hairline)] bg-[color:var(--landing-elevated)] px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium sm:text-sm">
                      <span className="landing-mono">{trip.code}</span>
                      <span className="text-[color:var(--landing-muted)] font-normal">
                        {" "}
                        · {trip.route}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-[color:var(--landing-muted)] sm:text-xs">
                      {trip.fiscal}
                    </p>
                  </div>
                  <span className="landing-preview-badge shrink-0">
                    {trip.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
