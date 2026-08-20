import { Navigate, useParams } from "react-router-dom";

/**
 * Redirige la ruta legada /trips/:id/edit al detalle (ADR-0078 F2).
 */
export function TripEditRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <Navigate to="/trips" replace />;
  }
  return <Navigate to={`/trips/${id}`} replace />;
}
