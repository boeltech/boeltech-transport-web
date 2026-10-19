import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { useMapboxStyle } from "@shared/geolocation/application/hooks/useMapboxStyle";
import { cn } from "@shared/lib/utils/cn";
import type { FleetHistoryPoint } from "../../domain";

const SOURCE_ID = "history-track";
const LINE_LAYER = "history-track-line";
const DEFAULT_CENTER: [number, number] = [-102.5528, 23.6345];
const DEFAULT_ZOOM = 5;

export interface HistoryTrackMapProps {
  readonly token: string;
  readonly points: FleetHistoryPoint[];
  readonly selectedSeq: number | null;
  readonly className?: string;
  readonly onSelectSeq?: (seq: number) => void;
}

function scheduleResize(map: mapboxgl.Map) {
  requestAnimationFrame(() => map.resize());
}

function toGeoJson(points: FleetHistoryPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: points.map((p) => [p.longitude, p.latitude]),
        },
      },
    ],
  };
}

export function HistoryTrackMap({
  token,
  points,
  selectedSeq,
  className,
  onSelectSeq,
}: HistoryTrackMapProps) {
  const mapboxStyle = useMapboxStyle();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const ghostRef = useRef<mapboxgl.Marker | null>(null);
  const prevStyleRef = useRef(mapboxStyle);
  const onSelectRef = useRef(onSelectSeq);
  onSelectRef.current = onSelectSeq;
  const fittedRef = useRef(false);

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

    const ensureLayers = () => {
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: toGeoJson([]),
        });
      }
      if (!map.getLayer(LINE_LAYER)) {
        map.addLayer({
          id: LINE_LAYER,
          type: "line",
          source: SOURCE_ID,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#10b981",
            "line-width": 3.5,
            "line-opacity": 0.9,
          },
        });
      }
    };

    const onLoad = () => {
      ensureLayers();
      scheduleResize(map);
    };
    map.on("load", onLoad);
    map.on("style.load", ensureLayers);

    const observer = new ResizeObserver(() => scheduleResize(map));
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.off("load", onLoad);
      ghostRef.current?.remove();
      ghostRef.current = null;
      map.remove();
      mapRef.current = null;
      fittedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || prevStyleRef.current === mapboxStyle) return;
    prevStyleRef.current = mapboxStyle;
    fittedRef.current = false;
    map.setStyle(mapboxStyle);
  }, [mapboxStyle]);

  // Sync polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (!source) return;
      source.setData(toGeoJson(points));

      if (points.length >= 2 && !fittedRef.current) {
        const bounds = new mapboxgl.LngLatBounds();
        for (const p of points) {
          bounds.extend([p.longitude, p.latitude]);
        }
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 500 });
          fittedRef.current = true;
        }
      } else if (points.length === 1) {
        map.easeTo({
          center: [points[0]!.longitude, points[0]!.latitude],
          zoom: 13,
          duration: 400,
        });
        fittedRef.current = true;
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, [points]);

  // Reset fit when track identity changes (new query)
  useEffect(() => {
    fittedRef.current = false;
  }, [points[0]?.recordedAt, points.length]);

  // Ghost marker + click nearest point
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const selected =
      selectedSeq != null
        ? points.find((p) => p.seq === selectedSeq) ?? null
        : null;

    if (!selected) {
      ghostRef.current?.remove();
      ghostRef.current = null;
      return;
    }

    const lngLat: [number, number] = [selected.longitude, selected.latitude];
    if (!ghostRef.current) {
      const el = document.createElement("div");
      el.className = "history-ghost-marker";
      el.style.cssText =
        "width:14px;height:14px;border-radius:9999px;background:#fff;border:3px solid #059669;box-shadow:0 0 0 4px rgba(16,185,129,0.25);";
      ghostRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      ghostRef.current.setLngLat(lngLat);
    }
  }, [points, selectedSeq]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    const onClick = (e: mapboxgl.MapMouseEvent) => {
      let best: FleetHistoryPoint | null = null;
      let bestDist = Infinity;
      for (const p of points) {
        const projected = map.project([p.longitude, p.latitude]);
        const dx = projected.x - e.point.x;
        const dy = projected.y - e.point.y;
        const dist = Math.hypot(dx, dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = p;
        }
      }
      if (best && bestDist < 28) {
        onSelectRef.current?.(best.seq);
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [points]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      data-testid="history-track-map"
    />
  );
}
