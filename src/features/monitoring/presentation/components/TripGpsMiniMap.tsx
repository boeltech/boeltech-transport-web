import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { useMapboxStyle } from "@shared/geolocation/application/hooks/useMapboxStyle";
import { cn } from "@shared/lib/utils/cn";
import type { GpsPositionStatusType } from "../../domain";
import { createFleetMarkerElement } from "./FleetMapMarker";

export interface TripGpsMiniMapProps {
  readonly token: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly status: GpsPositionStatusType;
  readonly courseDeg: number | null;
  readonly label: string;
  readonly className?: string;
}

function scheduleResize(map: mapboxgl.Map) {
  requestAnimationFrame(() => map.resize());
}

function applyMarkerVisual(
  el: HTMLElement,
  params: {
    status: GpsPositionStatusType;
    courseDeg: number | null;
    label: string;
  },
): void {
  const fresh = createFleetMarkerElement(params);
  el.replaceChildren(...Array.from(fresh.childNodes));
  el.setAttribute("aria-label", fresh.getAttribute("aria-label") ?? "");
}

/**
 * Mini-mapa GL lite para overlay de viaje (D19): paneo mínimo, sin panel ni controles densos.
 */
export function TripGpsMiniMap({
  token,
  latitude,
  longitude,
  status,
  courseDeg,
  label,
  className,
}: TripGpsMiniMapProps) {
  const mapboxStyle = useMapboxStyle();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const prevStyleRef = useRef(mapboxStyle);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapboxStyle,
      center: [longitude, latitude],
      zoom: 13,
      attributionControl: false,
    });
    mapRef.current = map;
    prevStyleRef.current = mapboxStyle;

    const onLoad = () => scheduleResize(map);
    map.on("load", onLoad);

    const observer = new ResizeObserver(() => scheduleResize(map));
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.off("load", onLoad);
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // token + initial style only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || prevStyleRef.current === mapboxStyle) return;
    prevStyleRef.current = mapboxStyle;
    map.setStyle(mapboxStyle);
  }, [mapboxStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const lngLat: [number, number] = [longitude, latitude];
    map.easeTo({ center: lngLat, duration: 400 });

    if (markerRef.current) {
      markerRef.current.setLngLat(lngLat);
      applyMarkerVisual(markerRef.current.getElement(), {
        status,
        courseDeg,
        label,
      });
      return;
    }

    const el = createFleetMarkerElement({ status, courseDeg, label });
    markerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat(lngLat)
      .addTo(map);
  }, [latitude, longitude, status, courseDeg, label]);

  return (
    <div
      ref={containerRef}
      className={cn("h-44 w-full overflow-hidden rounded-lg", className)}
      data-testid="trip-gps-mini-map"
    />
  );
}
