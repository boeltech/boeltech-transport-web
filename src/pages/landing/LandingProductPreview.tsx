/**
 * Preview de marketing: crops A3 del producto o mock CSS.
 * Frame patio (F2). Montaje hacia/junto al hero en LandingPage.
 * Si el asset (`assetId` o dashboard) está enabled → imagen; si no → mock.
 * `backdrop={false}` cuando el hero ya aporta capas.
 * F1: crossfade del crop dentro del frame (chrome quieto).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";
import {
  isCommercialAssetEnabled,
  type CommercialAssetId,
} from "@shared/commercial/assets/commercialAssets";
import { CommercialImage } from "@shared/ui/commercial";
import { landingCopy } from "./landingCopy";

type LandingProductPreviewProps = {
  className?: string;
  /** Route-mesh detrás del frame. Default false en hero patio. */
  backdrop?: boolean;
  /** Índice en preview.navItems a resaltar (beats de evidencia, mock). */
  activeNavIndex?: number;
  /**
   * Crop A3 por beat. Default: product-preview-dashboard (hero).
   * Si el id no está enabled, cae al mock CSS.
   */
  assetId?: CommercialAssetId;
  /**
   * Carrusel evidencia: fuerza crossfade+slide aunque el SO tenga
   * prefers-reduced-motion (fade corto; hero sigue respetando reduce).
   */
  carouselMotion?: boolean;
};

const DEFAULT_ASSET_ID: CommercialAssetId = "product-preview-dashboard";
const ROUTE_MESH_SRC = "/brand/tlama-landing-route-mesh.svg";
/** Alineado a --landing-motion-crossfade (~400ms) + holgura. */
const CROSSFADE_CLEAR_MS = 420;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LandingProductPreview({
  className,
  backdrop = false,
  activeNavIndex = 1,
  assetId = DEFAULT_ASSET_ID,
  carouselMotion = false,
}: LandingProductPreviewProps) {
  if (isCommercialAssetEnabled(assetId)) {
    return (
      <PreviewShell className={className} backdrop={backdrop}>
        <LandingPreviewCropCrossfade
          assetId={assetId}
          carouselMotion={carouselMotion}
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

/**
 * Stack absoluto: capa bajo + entrante. El frame no se remonta.
 * Reduced-motion → swap instantáneo (una sola capa).
 * Ajuste de estado al cambiar prop: patrón React "store info from previous renders".
 */
function LandingPreviewCropCrossfade({
  assetId,
  carouselMotion = false,
}: {
  assetId: CommercialAssetId;
  carouselMotion?: boolean;
}) {
  const [currentId, setCurrentId] = useState(assetId);
  const [outgoingId, setOutgoingId] = useState<CommercialAssetId | null>(null);
  const [seenAssetId, setSeenAssetId] = useState(assetId);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (assetId !== seenAssetId) {
    setSeenAssetId(assetId);
    const instant = prefersReducedMotion() && !carouselMotion;
    if (instant) {
      setOutgoingId(null);
      setCurrentId(assetId);
    } else if (assetId !== currentId) {
      setOutgoingId(currentId);
      setCurrentId(assetId);
    }
  }

  useEffect(() => {
    if (!outgoingId) return;

    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      setOutgoingId(null);
      clearTimerRef.current = null;
    }, CROSSFADE_CLEAR_MS);

    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [outgoingId]);

  return (
    <div
      className={cn(
        "landing-preview-crop-stack",
        carouselMotion && "is-carousel-slide",
      )}
      data-landing-crop-crossfade={outgoingId ? "active" : "idle"}
    >
      {outgoingId ? (
        <CommercialImage
          key={`out-${outgoingId}`}
          id={outgoingId}
          decorative
          loading="eager"
          className="landing-preview-crop is-under h-full w-full max-w-none rounded-xl object-cover object-top"
        />
      ) : null}
      <CommercialImage
        key={`in-${currentId}`}
        id={currentId}
        decorative
        loading="eager"
        className={cn(
          "landing-preview-crop h-full w-full max-w-none rounded-xl object-cover object-top",
          outgoingId ? "is-enter" : "is-settled",
        )}
      />
    </div>
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
