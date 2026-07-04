import { useEffect, useState } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useWatch } from "react-hook-form";
import {
  evaluateCoordinatesVsMexicanPostalCodeWarning,
  isMexicanPostalCodeForWarning,
  parseCoordinateValue,
  type CoordinatesPostalCodeWarningDetails,
} from "@shared/geolocation/coordinatesVsMexicanPostalCode";

const DEBOUNCE_MS = 500;

export function useCoordinatesPostalCodeWarning<TFieldValues extends FieldValues>(
  control: Control<TFieldValues>,
  namePrefix: string,
  options: { enabled: boolean },
): CoordinatesPostalCodeWarningDetails | null {
  const postalCodePath = `${namePrefix}.postalCode` as Path<TFieldValues>;
  const countryPath = `${namePrefix}.satCountryCode` as Path<TFieldValues>;
  const statePath = `${namePrefix}.satStateCode` as Path<TFieldValues>;
  const municipalityPath = `${namePrefix}.satMunicipalityCode` as Path<TFieldValues>;
  const latitudePath = `${namePrefix}.latitude` as Path<TFieldValues>;
  const longitudePath = `${namePrefix}.longitude` as Path<TFieldValues>;

  const postalCode = useWatch({ control, name: postalCodePath });
  const satCountryCode = useWatch({ control, name: countryPath });
  const satStateCode = useWatch({ control, name: statePath });
  const satMunicipalityCode = useWatch({ control, name: municipalityPath });
  const latitude = useWatch({ control, name: latitudePath });
  const longitude = useWatch({ control, name: longitudePath });

  const [warning, setWarning] =
    useState<CoordinatesPostalCodeWarningDetails | null>(null);

  const lat = parseCoordinateValue(latitude);
  const lng = parseCoordinateValue(longitude);
  const cp = String(postalCode ?? "").trim();
  const canEvaluate =
    options.enabled &&
    isMexicanPostalCodeForWarning(cp, satCountryCode) &&
    lat != null &&
    lng != null;

  useEffect(() => {
    if (!canEvaluate || lat == null || lng == null) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void evaluateCoordinatesVsMexicanPostalCodeWarning({
        postalCode: cp,
        satCountryCode,
        satStateCode: String(satStateCode ?? "").trim() || null,
        satMunicipalityCode: String(satMunicipalityCode ?? "").trim() || null,
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
    lat,
    latitude,
    lng,
    longitude,
    options.enabled,
    postalCode,
    satCountryCode,
    satMunicipalityCode,
    satStateCode,
  ]);

  return canEvaluate ? warning : null;
}
