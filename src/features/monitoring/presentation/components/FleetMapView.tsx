import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { useMapboxStyle } from "@shared/geolocation/application/hooks/useMapboxStyle";
import { cn } from "@shared/lib/utils/cn";
import type { FleetVehiclePosition } from "../../domain";
import { createFleetMarkerElement } from "./FleetMapMarker";
import { buildFleetPopupHtml } from "./fleetPopupHtml";

const DEFAULT_CENTER: [number, number] = [-102.5528, 23.6345];
const DEFAULT_ZOOM = 4.8;

type MarkerEntry = {
  marker: mapboxgl.Marker;
};

export interface FleetMapViewProps {
  readonly token: string;
  readonly positions: FleetVehiclePosition[];
  readonly focusVehicleId: string | null;
  readonly className?: string;
  readonly onMarkerSelect?: (position: FleetVehiclePosition) => void;
}

function scheduleResize(map: mapboxgl.Map) {
  requestAnimationFrame(() => map.resize());
}

function applyMarkerVisual(
  el: HTMLElement,
  position: FleetVehiclePosition,
): void {
  const fresh = createFleetMarkerElement({
    status: position.status,
    courseDeg: position.courseDeg,
    label: position.vehicleEconomicNumber,
    unreadAlertCount: position.unreadAlertCount ?? 0,
  });
  el.replaceChildren(...Array.from(fresh.childNodes));
  el.setAttribute("aria-label", fresh.getAttribute("aria-label") ?? "");
}

export function FleetMapView({
  token,
  positions,
  focusVehicleId,
  className,
  onMarkerSelect,
}: FleetMapViewProps) {
  const mapboxStyle = useMapboxStyle();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const prevStyleRef = useRef(mapboxStyle);
  const onSelectRef = useRef(onMarkerSelect);
  onSelectRef.current = onMarkerSelect;

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapboxStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-left",
    );
    mapRef.current = map;
    prevStyleRef.current = mapboxStyle;

    const onLoad = () => scheduleResize(map);
    map.on("load", onLoad);

    const observer = new ResizeObserver(() => scheduleResize(map));
    observer.observe(containerRef.current);
    const markers = markersRef.current;

    return () => {
      observer.disconnect();
      map.off("load", onLoad);
      markers.forEach((entry) => {
        entry.marker.remove();
      });
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
    // token + initial style only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Theme style swap
  useEffect(() => {
    const map = mapRef.current;
    if (!map || prevStyleRef.current === mapboxStyle) return;
    prevStyleRef.current = mapboxStyle;
    map.setStyle(mapboxStyle);
  }, [mapboxStyle]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const withCoords = positions.filter(
      (p) => p.latitude != null && p.longitude != null,
    );
    const nextIds = new Set(withCoords.map((p) => p.vehicleId));

    markersRef.current.forEach((entry, id) => {
      if (!nextIds.has(id)) {
        entry.marker.remove();
        markersRef.current.delete(id);
      }
    });

    for (const position of withCoords) {
      const lngLat: [number, number] = [
        position.longitude!,
        position.latitude!,
      ];
      const existing = markersRef.current.get(position.vehicleId);
      const popupHtml = buildFleetPopupHtml(position);

      if (existing) {
        existing.marker.setLngLat(lngLat);
        applyMarkerVisual(existing.marker.getElement(), position);
        existing.marker.getPopup()?.setHTML(popupHtml);
        continue;
      }

      const el = createFleetMarkerElement({
        status: position.status,
        courseDeg: position.courseDeg,
        label: position.vehicleEconomicNumber,
        unreadAlertCount: position.unreadAlertCount ?? 0,
      });

      const popup = new mapboxgl.Popup({
        offset: 18,
        closeButton: true,
        maxWidth: "280px",
        className: "fleet-map-popup",
      }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        onSelectRef.current?.(position);
      });

      markersRef.current.set(position.vehicleId, { marker });
    }

    if (withCoords.length > 0 && !focusVehicleId) {
      const bounds = new mapboxgl.LngLatBounds();
      for (const p of withCoords) {
        bounds.extend([p.longitude!, p.latitude!]);
      }
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 72, maxZoom: 12, duration: 600 });
      }
    }
  }, [positions, focusVehicleId]);

  // Focus / fly to selected — always open popup (no toggle)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusVehicleId) return;
    const entry = markersRef.current.get(focusVehicleId);
    if (!entry) return;
    const { lng, lat } = entry.marker.getLngLat();
    map.easeTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 12),
      duration: 700,
    });
    const popup = entry.marker.getPopup();
    if (popup && !popup.isOpen()) {
      entry.marker.togglePopup();
    }
  }, [focusVehicleId]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      data-testid="fleet-map-view"
    />
  );
}
