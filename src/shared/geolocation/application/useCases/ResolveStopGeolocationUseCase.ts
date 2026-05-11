import type {
  GeocodeOutcome,
  GeocodingProvider,
  GeocodeQuery,
  LatLng,
} from "@shared/geolocation/contracts/geoPorts";

export interface ResolveStopGeolocationInput {
  readonly street?: string | null;
  readonly exteriorNumber?: string | null;
  readonly interiorNumber?: string | null;
  readonly postalCode?: string | null;
  readonly satMunicipalityCode?: string | null;
  readonly satStateCode?: string | null;
  readonly satCountryCode?: string | null;
  readonly locationName?: string | null;
  readonly proximity?: LatLng;
}

function compactAddress(input: ResolveStopGeolocationInput): string {
  const chunks = [
    [input.street, input.exteriorNumber].filter(Boolean).join(" "),
    input.interiorNumber ? `Int ${input.interiorNumber}` : "",
    input.locationName || "",
    input.postalCode ? `CP ${input.postalCode}` : "",
    input.satMunicipalityCode || "",
    input.satStateCode || "",
    input.satCountryCode || "MEX",
  ]
    .map((value) => (value ?? "").trim())
    .filter(Boolean);
  return chunks.join(", ");
}

export class ResolveStopGeolocationUseCase {
  private readonly geocodingProvider: GeocodingProvider;

  constructor(geocodingProvider: GeocodingProvider) {
    this.geocodingProvider = geocodingProvider;
  }

  async execute(
    input: ResolveStopGeolocationInput,
    limit = 5,
  ): Promise<GeocodeOutcome> {
    const queryText = compactAddress(input);
    if (!queryText) {
      return {
        ok: false,
        error: {
          code: "GEO_ZERO_RESULTS",
          message: "No hay datos suficientes de dirección para geocodificar.",
        },
      };
    }

    const query: GeocodeQuery = {
      query: queryText,
      limit,
      countryCode: input.satCountryCode ?? "MEX",
      proximity: input.proximity,
    };
    return this.geocodingProvider.forwardGeocode(query);
  }
}
