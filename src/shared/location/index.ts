export {
  GEOCODING_ACCURACY_BADGE_VARIANT,
  GEOCODING_ACCURACY_LABELS,
  GEOCODING_ACCURACY_VALUES,
  getGeocodingAccuracyBadgeVariant,
  getGeocodingAccuracyLabel,
  isGeocodingAccuracy,
  type GeocodingAccuracy,
  type GeocodingAccuracyBadgeVariant,
} from "./geocodingAccuracy";

export {
  detectPossibleDuplicates,
  levenshtein,
  type DuplicateCandidate,
  type DuplicateReason,
  type DuplicateWarning,
} from "./detectPossibleDuplicates";
