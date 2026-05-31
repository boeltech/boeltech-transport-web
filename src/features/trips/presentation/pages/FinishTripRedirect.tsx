import { Navigate, useParams } from "react-router-dom";

/**
 * Redirige la ruta legada /trips/:id/finish al tab Seguimiento (cierre unificado).
 */
export function FinishTripRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <Navigate to="/trips" replace />;
  }
  return <Navigate to={`/trips/${id}?tab=tracking`} replace />;
}
