/**
 * EditTrailerPage — redirect legacy /trailers/:id/edit → listado + sheet.
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
