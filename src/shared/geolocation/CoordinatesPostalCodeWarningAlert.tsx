import { Alert, AlertDescription } from "@shared/ui/alert";
import type { CoordinatesPostalCodeWarningDetails } from "@shared/geolocation/coordinatesVsMexicanPostalCode";

export interface CoordinatesPostalCodeWarningCopy {
  coordinatesFarFromPostalCode: (distanceKm: number, postalCode: string) => string;
  coordinatesFarFromPostalCodeReference: (input: {
    label: string;
    latitude: number;
    longitude: number;
    query: string;
    resolutionSource: string;
  }) => string;
}

export interface CoordinatesPostalCodeWarningAlertProps {
  warning: CoordinatesPostalCodeWarningDetails;
  copy: CoordinatesPostalCodeWarningCopy;
}

export function CoordinatesPostalCodeWarningAlert({
  warning,
  copy,
}: CoordinatesPostalCodeWarningAlertProps) {
  return (
    <Alert variant="warning">
      <AlertDescription className="space-y-2">
        <p>
          {copy.coordinatesFarFromPostalCode(
            warning.distanceKm,
            warning.postalCode,
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {copy.coordinatesFarFromPostalCodeReference({
            label: warning.reference.label,
            latitude: warning.reference.position.latitude,
            longitude: warning.reference.position.longitude,
            query: warning.reference.query,
            resolutionSource: warning.reference.resolutionSource,
          })}
        </p>
      </AlertDescription>
    </Alert>
  );
}
