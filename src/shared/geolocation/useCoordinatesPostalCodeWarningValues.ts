import { useEffect, useState } from "react";
import {
  evaluateCoordinatesVsMexicanPostalCodeWarning,
  isMexicanPostalCodeForWarning,
  parseCoordinateValue,
  type CoordinatesPostalCodeWarningDetails,
} from "@shared/geolocation/coordinatesVsMexicanPostalCode";

const DEBOUNCE_MS = 500;

export function useCoordinatesPostalCodeWarningValues(input: {
  enabled: boolean;
  postalCode?: string | null;
  satCountryCode?: string | null;
  satStateCode?: string | null;
  satMunicipalityCode?: string | null;
  latitude?: unknown;
  longitude?: unknown;
}): CoordinatesPostalCodeWarningDetails | null {
  const [warning, setWarning] =
    useState<CoordinatesPostalCodeWarningDetails | null>(null);

  const lat = parseCoordinateValue(input.latitude);
  const lng = parseCoordinateValue(input.longitude);
  const cp = String(input.postalCode ?? "").trim();
  const canEvaluate =
    input.enabled &&
    isMexicanPostalCodeForWarning(cp, input.satCountryCode) &&
    lat != null &&
    lng != null;

  useEffect(() => {
    if (!canEvaluate || lat == null || lng == null) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void evaluateCoordinatesVsMexicanPostalCodeWarning({
        postalCode: cp,
        satCountryCode: input.satCountryCode,
        satStateCode: String(input.satStateCode ?? "").trim() || null,
        satMunicipalityCode:
          String(input.satMunicipalityCode ?? "").trim() || null,
        latitude: lat,
        longitude: lng,
      }).then((result) => {
        if (cancelled) return;
        setWarning(result);
      });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    canEvaluate,
    cp,
    input.enabled,
    input.latitude,
    input.longitude,
    input.postalCode,
    input.satCountryCode,
    input.satMunicipalityCode,
    input.satStateCode,
    lat,
    lng,
  ]);

  return canEvaluate ? warning : null;
}
