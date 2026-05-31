import type { TrackingEvent, TrackingTimelineMapPosition, TripStop } from "@features/trips/domain";

export type TrackingMapStopMarker = {
  id: string;
  order: number;
  latitude: number;
  longitude: number;
  label: string;
  sublabel?: string;
};

export type TrackingMapEventMarker = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
};

const ROUTE_LAYER_ID = "trip-tracking-route";
const ROUTE_SOURCE_ID = "trip-tracking-route-source";

export { ROUTE_LAYER_ID, ROUTE_SOURCE_ID };

export function buildStopMarkers(stops: readonly TripStop[]): TrackingMapStopMarker[] {
  const markers: TrackingMapStopMarker[] = [];
  for (const [index, stop] of stops.entries()) {
    if (stop.latitude == null || stop.longitude == null) continue;
    markers.push({
      id: stop.id,
      order: index + 1,
      latitude: stop.latitude,
      longitude: stop.longitude,
      label: stop.locationName || `Parada ${index + 1}`,
      sublabel: stop.city || stop.address || undefined,
    });
  }
  return markers;
}

export function buildEventMarkers(
  events: readonly TrackingEvent[],
): TrackingMapEventMarker[] {
  return events
    .filter((event) => event.latitude != null && event.longitude != null)
    .map((event) => ({
      id: event.id,
      latitude: event.latitude as number,
      longitude: event.longitude as number,
      label: event.eventType,
    }));
}

export function isRouteGeoJson(
  value: unknown,
): value is GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: string }).type;
  return (
    type === "FeatureCollection" ||
    type === "Feature" ||
    type === "LineString" ||
    type === "MultiLineString"
  );
}

export function collectMapBounds(
  stopMarkers: TrackingMapStopMarker[],
  eventMarkers: TrackingMapEventMarker[],
  lastKnown: TrackingTimelineMapPosition | null,
): [[number, number], [number, number]] | null {
  const points: [number, number][] = [];

  for (const stop of stopMarkers) {
    points.push([stop.longitude, stop.latitude]);
  }
  for (const event of eventMarkers) {
    points.push([event.longitude, event.latitude]);
  }
  if (lastKnown) {
    points.push([lastKnown.longitude, lastKnown.latitude]);
  }

  if (points.length === 0) return null;
  if (points.length === 1) {
    const [lng, lat] = points[0]!;
    return [
      [lng - 0.02, lat - 0.02],
      [lng + 0.02, lat + 0.02],
    ];
  }

  let minLng = points[0]![0];
  let minLat = points[0]![1];
  let maxLng = points[0]![0];
  let maxLat = points[0]![1];

  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
