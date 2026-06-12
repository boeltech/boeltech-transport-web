import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { TrackingEvent, TrackingTimelineMapPosition, TripStop } from "@features/trips/domain";
import { cn } from "@shared/lib/utils/cn";
import { useMapboxStyle } from "@shared/geolocation/application/hooks/useMapboxStyle";
import { getChartPrimaryColor } from "@shared/geolocation/mapboxThemeColors";

import {
  ROUTE_LAYER_ID,
  ROUTE_SOURCE_ID,
  buildEventMarkers,
  buildStopMarkers,
  collectMapBounds,
  isRouteGeoJson,
  type TrackingMapEventMarker,
  type TrackingMapStopMarker,
} from "./trackingMapHelpers";

const DEFAULT_CENTER: [number, number] = [-102.5528, 23.6345];
const DEFAULT_ZOOM = 4.5;

function scheduleMapResize(map: mapboxgl.Map) {
  requestAnimationFrame(() => map.resize());
}

/** Tras salir de `display:none` (tabs/sheets), un frame extra ayuda a medir bien el contenedor. */
function scheduleMapResizeAfterReveal(map: mapboxgl.Map) {
  scheduleMapResize(map);
  requestAnimationFrame(() => scheduleMapResize(map));
}

function createNumberedMarkerElement(order: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className =
    "flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-semibold text-primary-foreground shadow-md";
  el.textContent = String(order);
  return el;
}

function createPulseMarkerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "relative flex h-4 w-4 items-center justify-center";
  el.innerHTML =
    '<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60"></span><span class="relative inline-flex h-3 w-3 rounded-full border-2 border-background bg-destructive"></span>';
  return el;
}

function createEventMarkerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className =
    "h-2.5 w-2.5 rounded-full border border-background bg-warning shadow";
  return el;
}

type SyncMapOverlaysParams = {
  stopMarkers: TrackingMapStopMarker[];
  eventMarkers: TrackingMapEventMarker[];
  lastKnownPosition: TrackingTimelineMapPosition | null;
  routeGeojson: Record<string, unknown> | null;
  bounds: mapboxgl.LngLatBoundsLike | null;
  markersRef: React.MutableRefObject<mapboxgl.Marker[]>;
};

function syncMapOverlays(map: mapboxgl.Map, params: SyncMapOverlaysParams) {
  const {
    stopMarkers,
    eventMarkers,
    lastKnownPosition,
    routeGeojson,
    bounds,
    markersRef,
  } = params;

  markersRef.current.forEach((marker) => marker.remove());
  markersRef.current = [];

  for (const stop of stopMarkers) {
    const marker = new mapboxgl.Marker({
      element: createNumberedMarkerElement(stop.order),
    })
      .setLngLat([stop.longitude, stop.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 16 }).setHTML(
          `<strong>${stop.order}. ${stop.label}</strong>${
            stop.sublabel
              ? `<br/><span style="font-size:12px;opacity:0.75">${stop.sublabel}</span>`
              : ""
          }`,
        ),
      )
      .addTo(map);
    markersRef.current.push(marker);
  }

  for (const event of eventMarkers) {
    const marker = new mapboxgl.Marker({ element: createEventMarkerElement() })
      .setLngLat([event.longitude, event.latitude])
      .addTo(map);
    markersRef.current.push(marker);
  }

  if (lastKnownPosition) {
    const marker = new mapboxgl.Marker({ element: createPulseMarkerElement() })
      .setLngLat([lastKnownPosition.longitude, lastKnownPosition.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 12 }).setText("Última posición reportada"),
      )
      .addTo(map);
    markersRef.current.push(marker);
  }

  if (map.getLayer(ROUTE_LAYER_ID)) {
    map.removeLayer(ROUTE_LAYER_ID);
  }
  if (map.getSource(ROUTE_SOURCE_ID)) {
    map.removeSource(ROUTE_SOURCE_ID);
  }

  if (routeGeojson && isRouteGeoJson(routeGeojson)) {
    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: routeGeojson as GeoJSON.GeoJSON,
    });
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      paint: {
        "line-color": getChartPrimaryColor(),
        "line-width": 4,
        "line-opacity": 0.75,
      },
    });
  }

  if (bounds) {
    map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 600 });
  } else {
    map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 0 });
  }

  scheduleMapResize(map);
}

export type TripTrackingMapViewProps = {
  token: string;
  stops: readonly TripStop[];
  events: readonly TrackingEvent[];
  routeGeojson: Record<string, unknown> | null;
  lastKnownPosition: TrackingTimelineMapPosition | null;
  className?: string;
};

export function TripTrackingMapView({
  token,
  stops,
  events,
  routeGeojson,
  lastKnownPosition,
  className,
}: TripTrackingMapViewProps) {
  const mapboxStyle = useMapboxStyle();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const prevMapboxStyleRef = useRef(mapboxStyle);
  const [isVisible, setIsVisible] = useState(false);

  const stopMarkers = useMemo(() => buildStopMarkers(stops), [stops]);
  const eventMarkers = useMemo(() => buildEventMarkers(events), [events]);
  const bounds = useMemo(
    () => collectMapBounds(stopMarkers, eventMarkers, lastKnownPosition),
    [stopMarkers, eventMarkers, lastKnownPosition],
  );

  const overlayParams = useMemo(
    () => ({
      stopMarkers,
      eventMarkers,
      lastKnownPosition,
      routeGeojson,
      bounds,
      markersRef,
    }),
    [stopMarkers, eventMarkers, lastKnownPosition, routeGeojson, bounds],
  );

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setIsVisible(visible);
        if (visible && mapRef.current) {
          scheduleMapResizeAfterReveal(mapRef.current);
        }
      },
      { threshold: 0 },
    );
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

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

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    const resize = () => scheduleMapResize(map);
    map.on("load", () => {
      resize();
      syncMapOverlays(map, overlayParams);
    });

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(shell);
    resizeObserverRef.current = resizeObserver;
    mapRef.current = map;
    prevMapboxStyleRef.current = mapboxStyle;
    scheduleMapResizeAfterReveal(map);
  }, [isVisible, mapboxStyle, overlayParams, token]);

  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isVisible || prevMapboxStyleRef.current === mapboxStyle) return;

    prevMapboxStyleRef.current = mapboxStyle;
    map.setStyle(mapboxStyle);
    map.once("style.load", () => {
      syncMapOverlays(map, overlayParams);
    });
  }, [isVisible, mapboxStyle, overlayParams]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isVisible) return;

    const applyOverlays = () => syncMapOverlays(map, overlayParams);

    if (map.isStyleLoaded()) {
      applyOverlays();
      return;
    }

    map.once("style.load", applyOverlays);
  }, [bounds, eventMarkers, isVisible, lastKnownPosition, overlayParams, routeGeojson, stopMarkers]);

  return (
    <div
      ref={shellRef}
      className={cn(
        "relative h-72 w-full min-w-0 overflow-hidden rounded-md border bg-muted/30",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
