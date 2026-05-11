export type GeoProviderId = "mapbox" | "stub";

export type DistanceSource =
  | "manual"
  | "mapbox_matrix"
  | "haversine_fallback";

export type DistanceConfidence = "high" | "medium" | "low";

export type IsoTimestamp = string;

export interface LatLng {
  readonly latitude: number;
  readonly longitude: number;
}

export interface GeocodeQuery {
  readonly query: string;
  readonly limit?: number;
  readonly countryCode?: string;
  readonly proximity?: LatLng;
}

export interface GeocodingCandidate {
  readonly label: string;
  readonly position: LatLng;
  readonly relevance?: number | null;
  readonly rawPlaceId?: string;
}

export interface GeocodeResult {
  readonly provider: GeoProviderId;
  readonly candidates: GeocodingCandidate[];
  readonly requestedAt: IsoTimestamp;
}

export type GeoErrorCode =
  | "GEO_PROVIDER_UNAVAILABLE"
  | "GEO_ZERO_RESULTS"
  | "GEO_AMBIGUOUS"
  | "GEO_RATE_LIMITED"
  | "GEO_INVALID_COORDINATES"
  | "GEO_ROUTE_NOT_FOUND";

export interface GeoFailure {
  readonly code: GeoErrorCode;
  readonly message: string;
  readonly provider?: GeoProviderId;
}

export type GeocodeOutcome =
  | { ok: true; data: GeocodeResult }
  | { ok: false; error: GeoFailure };

export interface GeocodingProvider {
  forwardGeocode(query: GeocodeQuery): Promise<GeocodeOutcome>;
}

export type TransportProfile = "driving" | "driving_traffic";

export interface MatrixSegmentInput {
  readonly origin: LatLng;
  readonly destination: LatLng;
  readonly profile?: TransportProfile;
}

export interface SegmentDistanceResult {
  readonly distanceKm: number;
  readonly durationSeconds?: number | null;
  readonly provider: GeoProviderId;
  readonly source: DistanceSource;
  readonly confidence: DistanceConfidence;
  readonly computedAt: IsoTimestamp;
}

export type MatrixOutcome =
  | { ok: true; data: SegmentDistanceResult }
  | { ok: false; error: GeoFailure };

export type SegmentsMatrixOutcome =
  | { ok: true; data: SegmentDistanceResult[] }
  | { ok: false; error: GeoFailure };

export interface DistanceMatrixProvider {
  segmentDistance(input: MatrixSegmentInput): Promise<MatrixOutcome>;
  /** Varios tramos en orden (backend `/geo/distance-segments`). */
  segmentsDistance(segments: MatrixSegmentInput[]): Promise<SegmentsMatrixOutcome>;
}

export interface StopDistanceMetadata {
  readonly distanceFromPreviousKm: number | null;
  readonly distanceSource: DistanceSource;
  readonly distanceProvider: GeoProviderId;
  readonly distanceConfidence: DistanceConfidence;
  readonly distanceComputedAt: IsoTimestamp | null;
}
