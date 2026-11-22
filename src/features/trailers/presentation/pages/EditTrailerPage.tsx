/**
 * EditTrailerPage — redirect legacy /trailers/:id/edit → listado + sheet.
 *
 * N/A FormPageShell / migas (B-U03): la edición vive en TrailerCatalogSheet
 * (Navigate → `?edit=<id>`), no en un form de página completa.
 */

import { Navigate, useParams } from "react-router-dom";
import { trailerCatalogListHref } from "../trailerCatalogSheetParams";

export function EditTrailerPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/trailers" replace />;
  }

  return <Navigate to={trailerCatalogListHref({ editId: id })} replace />;
}
