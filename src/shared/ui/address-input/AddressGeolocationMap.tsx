import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@shared/lib/utils/cn";
import { useMapboxStyle } from "@shared/geolocation/application/hooks/useMapboxStyle";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface GeolocationCandidateMarker {
  readonly latitude: number;
  readonly longitude: number;
  readonly label: string;
}

interface AddressGeolocationMapProps {
  token: string;
  latitude?: number | null;
  longitude?: number | null;
  onCoordinatesChange: (coords: { latitude: number; longitude: number }) => void;
  disabled?: boolean;
  className?: string;
  /** compact: sheets angostos; comfortable: páginas / wizard. */
  density?: "compact" | "comfortable";
  /** D3: numbered candidate markers shown during multi-result geocoding. */
  candidates?: GeolocationCandidateMarker[];
  /** D3: index of the currently selected candidate (0-based). */
  selectedCandidateIndex?: number | null;
  /** D3: callback when user clicks a candidate marker on the map. */
  onCandidateSelect?: (index: number) => void;
  /** Tooltip text for the confirmed pin (D2 popup). */
  markerTooltip?: string | null;
}

const DEFAULT_CENTER: [number, number] = [-102.5528, 23.6345];
const DEFAULT_ZOOM = 4.5;
const FOCUS_ZOOM = 15;
const CANDIDATES_ZOOM = 12;
/** Coincide con el redondeo a 6 decimales que emitimos en drag/click. */
const COORDS_EPSILON = 1e-6;
/** Sheet slide-in ~500ms; Mapbox needs resize after CSS transform settles. */
const SHEET_RESIZE_DELAYS_MS = [0, 120, 520] as const;

function scheduleMapResize(map: mapboxgl.Map) {
  requestAnimationFrame(() => {
    map.resize();
  });
}

/** Tras animación de Sheet / reveal, varios resizes corrigen el hit-test del canvas. */
function scheduleMapResizeAfterReveal(map: mapboxgl.Map) {
  for (const delay of SHEET_RESIZE_DELAYS_MS) {
    window.setTimeout(() => {
      try {
        map.resize();
      } catch {
        // map may have been removed
      }
    }, delay);
  }
  scheduleMapResize(map);
  requestAnimationFrame(() => scheduleMapResize(map));
}

function createNumberedMarkerElement(index: number, selected: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.className = [
    "flex items-center justify-center rounded-full text-xs font-bold",
    "border-2 shadow-sm cursor-pointer select-none",
    selected
      ? "h-8 w-8 bg-primary text-primary-foreground border-primary-700"
      : "h-6 w-6 bg-card text-foreground border-border hover:border-primary",
  ].join(" ");
  el.textContent = String(index + 1);
  el.style.transition = "all 150ms ease";
  return el;
}

function sameCoords(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < COORDS_EPSILON &&
    Math.abs(a.longitude - b.longitude) < COORDS_EPSILON
  );
}

/** Firma estable de la lista de coincidencias; `null` si no hay multi-candidato. */
export function candidateListSignature(
  candidates: readonly GeolocationCandidateMarker[] | undefined,
): string | null {
  if (!candidates || candidates.length <= 1) return null;
  return candidates
    .map(
      (c) =>
        `${c.latitude.toFixed(6)},${c.longitude.toFixed(6)}:${c.label}`,
    )
    .join("|");
}

/** Solo reencuadrar al recibir un juego nuevo de coincidencias, no al cambiar selección. */
export function shouldFitCandidateBounds(
  prevSignature: string | null,
  nextSignature: string | null,
): boolean {
  return nextSignature != null && nextSignature !== prevSignature;
}

export function AddressGeolocationMap({
  token,
  latitude,
  longitude,
  onCoordinatesChange,
  disabled = false,
  className,
  density = "comfortable",
  candidates,
  selectedCandidateIndex,
  onCandidateSelect,
  markerTooltip,
}: AddressGeolocationMapProps) {
  const hasCoordinates = latitude != null && longitude != null;
  const mapboxStyle = useMapboxStyle();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const candidateMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  const onCandidateSelectRef = useRef(onCandidateSelect);
  const disabledRef = useRef(disabled);
  const prevMapboxStyleRef = useRef(mapboxStyle);
  const syncMarkerRef = useRef<() => void>(() => undefined);
  /** Últimas coordenadas emitidas por interacción del usuario (drag/click). */
  const lastEmittedRef = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );
  /** Evita doble emisión map.click + container fallback en el mismo gesto. */
  const clickLockRef = useRef(false);
  /** Tras dragend, Mapbox/DOM a menudo emiten un click espurio en el canvas. */
  const suppressClickUntilRef = useRef(0);
  const lastCandidatesSignatureRef = useRef<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLocalPin, setHasLocalPin] = useState(false);

  useEffect(() => {
    onCoordinatesChangeRef.current = onCoordinatesChange;
  }, [onCoordinatesChange]);

  useEffect(() => {
    onCandidateSelectRef.current = onCandidateSelect;
  }, [onCandidateSelect]);

  useEffect(() => {
    disabledRef.current = disabled;
    markerRef.current?.setDraggable(!disabled);
  }, [disabled]);

  const placeMarkerAt = useCallback(
    (
      coords: { latitude: number; longitude: number },
      options?: { flyTo?: boolean },
    ) => {
      const map = mapRef.current;
      if (!map) return;

      const lngLat: [number, number] = [coords.longitude, coords.latitude];
      const wasEmpty = markerRef.current == null;

      if (!markerRef.current) {
        const marker = new mapboxgl.Marker({
          draggable: !disabledRef.current,
        })
          .setLngLat(lngLat)
          .addTo(map);
        marker.on("dragend", () => {
          if (disabledRef.current) return;
          const dragged = marker.getLngLat();
          const next = {
            latitude: Number(dragged.lat.toFixed(6)),
            longitude: Number(dragged.lng.toFixed(6)),
          };
          lastEmittedRef.current = next;
          // mouseup del drag suele disparar click en el mapa → no reubicar ni flyTo.
          suppressClickUntilRef.current = Date.now() + 300;
          clickLockRef.current = true;
          window.setTimeout(() => {
            clickLockRef.current = false;
          }, 300);
          setHasLocalPin(true);
          onCoordinatesChangeRef.current(next);
        });
        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat(lngLat);
        markerRef.current.setDraggable(!disabledRef.current);
      }

      setHasLocalPin(true);

      if (options?.flyTo || wasEmpty) {
        map.flyTo({ center: lngLat, zoom: FOCUS_ZOOM, duration: 500 });
        scheduleMapResize(map);
      }
    },
    [],
  );

  const emitCoordinates = useCallback(
    (
      coords: { latitude: number; longitude: number },
      options?: { flyTo?: boolean },
    ) => {
      lastEmittedRef.current = coords;
      // Pin inmediato (no esperar round-trip de React) — crítico dentro de Sheet.
      placeMarkerAt(coords, { flyTo: options?.flyTo ?? true });
      onCoordinatesChangeRef.current(coords);
    },
    [placeMarkerAt],
  );

  const emitCoordinatesRef = useRef(emitCoordinates);
  useEffect(() => {
    emitCoordinatesRef.current = emitCoordinates;
  }, [emitCoordinates]);

  const syncMarker = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isVisible) return;

    const hasPropsCoords = latitude != null && longitude != null;

    if (!hasPropsCoords) {
      // Mantener pin optimista hasta que el padre confirme coords.
      if (lastEmittedRef.current) {
        placeMarkerAt(lastEmittedRef.current, { flyTo: false });
        return;
      }
      popupRef.current?.remove();
      popupRef.current = null;
      markerRef.current?.remove();
      markerRef.current = null;
      setHasLocalPin(false);
      return;
    }

    const propsCoords = {
      latitude: latitude as number,
      longitude: longitude as number,
    };
    const isUserInteraction =
      lastEmittedRef.current != null &&
      sameCoords(lastEmittedRef.current, propsCoords);

    if (isUserInteraction && markerRef.current) {
      markerRef.current.setDraggable(!disabledRef.current);
      return;
    }

    placeMarkerAt(propsCoords, { flyTo: !isUserInteraction });
  }, [isVisible, latitude, longitude, placeMarkerAt]);

  useEffect(() => {
    syncMarkerRef.current = syncMarker;
  }, [syncMarker]);

  // D2: Sync marker tooltip/popup
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    if (markerTooltip) {
      if (!popupRef.current) {
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false,
          className: "geolocation-marker-popup",
        });
        popup.setText(markerTooltip);
        marker.setPopup(popup);
        popupRef.current = popup;
      } else {
        popupRef.current.setText(markerTooltip);
      }
    } else {
      popupRef.current?.remove();
      popupRef.current = null;
      marker.setPopup(undefined as unknown as mapboxgl.Popup);
    }
  }, [markerTooltip, latitude, longitude, hasLocalPin]);

  // D3: Sync candidate markers — fitBounds solo con lista nueva (no al limpiar selección por drag).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isVisible) return;

    for (const m of candidateMarkersRef.current) {
      m.remove();
    }
    candidateMarkersRef.current = [];

    const signature = candidateListSignature(candidates);
    if (!candidates || candidates.length <= 1) {
      lastCandidatesSignatureRef.current = null;
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    candidates.forEach((c, index) => {
      const isSelected = selectedCandidateIndex === index;
      const el = createNumberedMarkerElement(index, isSelected);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onCandidateSelectRef.current?.(index);
      });
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([c.longitude, c.latitude])
        .addTo(map);
      candidateMarkersRef.current.push(marker);
      bounds.extend([c.longitude, c.latitude]);
    });

    if (
      shouldFitCandidateBounds(lastCandidatesSignatureRef.current, signature) &&
      !bounds.isEmpty()
    ) {
      map.fitBounds(bounds, {
        padding: 40,
        maxZoom: CANDIDATES_ZOOM,
        duration: 500,
      });
    }
    lastCandidatesSignatureRef.current = signature;
  }, [candidates, isVisible, selectedCandidateIndex]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setIsVisible(visible);
        if (visible && mapRef.current) {
          scheduleMapResizeAfterReveal(mapRef.current);
        }
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(shell);

    return () => intersectionObserver.disconnect();
  }, []);

  // Create map once when visible — handlers via refs so deps stay stable.
  useEffect(() => {
    if (!isVisible || mapRef.current) return;

    const container = containerRef.current;
    const shell = shellRef.current;
    if (!container || !shell) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container,
      style: mapboxStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    const placeFromLngLat = (lng: number, lat: number) => {
      if (disabledRef.current) return;
      if (clickLockRef.current) return;
      if (Date.now() < suppressClickUntilRef.current) return;
      clickLockRef.current = true;
      window.setTimeout(() => {
        clickLockRef.current = false;
      }, 50);
      emitCoordinatesRef.current(
        {
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        },
        { flyTo: true },
      );
    };

    const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
      placeFromLngLat(event.lngLat.lng, event.lngLat.lat);
    };

    /**
     * Fallback: CSS transforms en Sheet a veces rompen el hit-test del canvas.
     * Unproject desde el contenedor coloca el pin donde el usuario ve el clic.
     */
    const handleContainerClick = (domEvent: MouseEvent) => {
      if (disabledRef.current) return;
      if (clickLockRef.current) return;
      const target = domEvent.target as HTMLElement | null;
      if (target?.closest(".mapboxgl-ctrl")) return;
      if (target?.closest(".mapboxgl-marker")) return;

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = domEvent.clientX - rect.left;
      const y = domEvent.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      // Dejar que map.on('click') gane; si no dispara, usar unproject.
      const before = lastEmittedRef.current;
      window.setTimeout(() => {
        if (lastEmittedRef.current !== before) return;
        if (!mapRef.current) return;
        map.resize();
        const lngLat = map.unproject([x, y]);
        placeFromLngLat(lngLat.lng, lngLat.lat);
      }, 0);
    };

    map.on("click", handleMapClick);
    container.addEventListener("click", handleContainerClick);

    const resize = () => scheduleMapResize(map);
    map.on("load", () => {
      resize();
      syncMarkerRef.current();
      scheduleMapResizeAfterReveal(map);
    });

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(shell);
    resizeObserverRef.current = resizeObserver;

    mapRef.current = map;
    prevMapboxStyleRef.current = mapboxStyle;
    scheduleMapResizeAfterReveal(map);
  }, [isVisible, mapboxStyle, token]);

  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      for (const m of candidateMarkersRef.current) {
        m.remove();
      }
      candidateMarkersRef.current = [];
      popupRef.current?.remove();
      popupRef.current = null;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      lastEmittedRef.current = null;
      lastCandidatesSignatureRef.current = null;
      suppressClickUntilRef.current = 0;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isVisible || prevMapboxStyleRef.current === mapboxStyle) return;

    prevMapboxStyleRef.current = mapboxStyle;
    for (const m of candidateMarkersRef.current) {
      m.remove();
    }
    candidateMarkersRef.current = [];
    markerRef.current?.remove();
    markerRef.current = null;
    setHasLocalPin(false);

    map.setStyle(mapboxStyle);
    map.once("style.load", () => {
      syncMarkerRef.current();
      scheduleMapResizeAfterReveal(map);
    });
  }, [isVisible, mapboxStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isVisible) return;

    if (!map.isStyleLoaded()) {
      map.once("style.load", () => syncMarkerRef.current());
      return;
    }

    syncMarker();
  }, [disabled, isVisible, latitude, longitude, syncMarker]);

  const showClickHint = !hasCoordinates && !hasLocalPin && !disabled;

  return (
    <div
      ref={shellRef}
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-md bg-muted/30",
        showClickHint ? "border border-dashed border-border" : "border",
        // D4: superficie de trabajo — no letterbox h-40/h-52
        density === "compact" ? "h-56" : "h-72",
        showClickHint && "cursor-crosshair",
        className,
      )}
      data-testid="address-geolocation-map"
      aria-label={
        showClickHint
          ? "Mapa para colocar el pin. Haz clic para ubicar."
          : "Mapa de ubicación"
      }
    >
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        data-testid="address-geolocation-map-canvas"
      />
    </div>
  );
}

export default AddressGeolocationMap;
