import { useEffect, useRef } from "react";
import { cn } from "@shared/lib/utils/cn";
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

export function AddressGeolocationMap({
  token,
  latitude,
  longitude,
  onCoordinatesChange,
  disabled = false,
  className,
}: AddressGeolocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("click", (event) => {
      if (disabled) return;
      const coords = {
        latitude: Number(event.lngLat.lat.toFixed(6)),
        longitude: Number(event.lngLat.lng.toFixed(6)),
      };
      onCoordinatesChange(coords);
    });

    mapRef.current = map;
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [disabled, onCoordinatesChange, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const hasCoordinates = latitude != null && longitude != null;

    if (!hasCoordinates) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const lngLat: [number, number] = [longitude as number, latitude as number];
    if (!markerRef.current) {
      const marker = new mapboxgl.Marker({ draggable: !disabled })
        .setLngLat(lngLat)
        .addTo(map);
      marker.on("dragend", () => {
        if (disabled) return;
        const dragged = marker.getLngLat();
        onCoordinatesChange({
          latitude: Number(dragged.lat.toFixed(6)),
          longitude: Number(dragged.lng.toFixed(6)),
        });
      });
      markerRef.current = marker;
      map.flyTo({ center: lngLat, zoom: FOCUS_ZOOM, duration: 700 });
      return;
    }

    markerRef.current.setDraggable(!disabled);
    markerRef.current.setLngLat(lngLat);
    map.flyTo({ center: lngLat, zoom: FOCUS_ZOOM, duration: 500 });
  }, [disabled, latitude, longitude, onCoordinatesChange]);

  return (
    <div
      ref={containerRef}
      className={cn("h-52 w-full overflow-hidden rounded-md border", className)}
    />
  );
}

export default AddressGeolocationMap;
