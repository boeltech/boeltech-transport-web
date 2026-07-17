import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@shared/lib/utils/cn";
import { useMapboxStyle } from "@shared/geolocation/application/hooks/useMapboxStyle";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface AddressGeolocationMapProps {
  token: string;
  latitude?: number | null;
  longitude?: number | null;
  onCoordinatesChange: (coords: { latitude: number; longitude: number }) => void;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [-102.5528, 23.6345];
const DEFAULT_ZOOM = 4.5;
const FOCUS_ZOOM = 15;
/** Coincide con el redondeo a 6 decimales que emitimos en drag/click. */
const COORDS_EPSILON = 1e-6;

function scheduleMapResize(map: mapboxgl.Map) {
  requestAnimationFrame(() => {
    map.resize();
  });
}

/** Tras salir de `display:none` (wizard/tabs), un frame extra ayuda a medir bien el contenedor. */
function scheduleMapResizeAfterReveal(map: mapboxgl.Map) {
  scheduleMapResize(map);
  requestAnimationFrame(() => scheduleMapResize(map));
}

export function AddressGeolocationMap({
  token,
  latitude,
  longitude,
  onCoordinatesChange,
  disabled = false,
  className,
}: AddressGeolocationMapProps) {
  const mapboxStyle = useMapboxStyle();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  const disabledRef = useRef(disabled);
  const prevMapboxStyleRef = useRef(mapboxStyle);
  /** Últimas coordenadas emitidas por interacción del usuario (drag/click). */
  const lastEmittedRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    onCoordinatesChangeRef.current = onCoordinatesChange;
  }, [onCoordinatesChange]);

  const emitCoordinates = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      lastEmittedRef.current = coords;
      onCoordinatesChangeRef.current(coords);
    },
    [],
  );

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const syncMarker = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isVisible) return;

    const hasCoordinates = latitude != null && longitude != null;

    if (!hasCoordinates) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const lngLat: [number, number] = [longitude as number, latitude as number];
    // Si estas coordenadas provienen de un drag/click en el mapa, el marcador ya
    // está en el punto exacto que soltó el usuario: no reposicionar ni recentrar.
    const isUserInteraction =
      lastEmittedRef.current != null &&
      Math.abs(lastEmittedRef.current.latitude - (latitude as number)) < COORDS_EPSILON &&
      Math.abs(lastEmittedRef.current.longitude - (longitude as number)) < COORDS_EPSILON;

    if (!markerRef.current) {
      const marker = new mapboxgl.Marker({ draggable: !disabledRef.current })
        .setLngLat(lngLat)
        .addTo(map);
      marker.on("dragend", () => {
        if (disabledRef.current) return;
        const dragged = marker.getLngLat();
        emitCoordinates({
          latitude: Number(dragged.lat.toFixed(6)),
          longitude: Number(dragged.lng.toFixed(6)),
        });
      });
      markerRef.current = marker;
      if (!isUserInteraction) {
        map.flyTo({ center: lngLat, zoom: FOCUS_ZOOM, duration: 700 });
      }
      scheduleMapResize(map);
      return;
    }

    markerRef.current.setDraggable(!disabledRef.current);
    if (isUserInteraction) {
      // Mantener la vista estable; el pin permanece donde lo dejó el usuario.
      return;
    }
    markerRef.current.setLngLat(lngLat);
    map.flyTo({ center: lngLat, zoom: FOCUS_ZOOM, duration: 500 });
    scheduleMapResize(map);
  }, [emitCoordinates, isVisible, latitude, longitude]);

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

    map.on("click", (event) => {
      if (disabledRef.current) return;
      emitCoordinates({
        latitude: Number(event.lngLat.lat.toFixed(6)),
        longitude: Number(event.lngLat.lng.toFixed(6)),
      });
    });

    const resize = () => scheduleMapResize(map);
    map.on("load", () => {
      resize();
      syncMarker();
    });

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(shell);
    resizeObserverRef.current = resizeObserver;

    mapRef.current = map;
    prevMapboxStyleRef.current = mapboxStyle;
    scheduleMapResizeAfterReveal(map);
  }, [emitCoordinates, isVisible, mapboxStyle, syncMarker, token]);

  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isVisible || prevMapboxStyleRef.current === mapboxStyle) return;

    prevMapboxStyleRef.current = mapboxStyle;
    markerRef.current?.remove();
    markerRef.current = null;

    map.setStyle(mapboxStyle);
    map.once("style.load", () => {
      syncMarker();
      scheduleMapResize(map);
    });
  }, [isVisible, mapboxStyle, syncMarker]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isVisible) return;

    if (!map.isStyleLoaded()) {
      map.once("style.load", syncMarker);
      return;
    }

    syncMarker();
  }, [disabled, isVisible, latitude, longitude, syncMarker]);

  return (
    <div
      ref={shellRef}
      className={cn(
        "relative h-52 w-full min-w-0 overflow-hidden rounded-md border bg-muted/30",
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export default AddressGeolocationMap;
