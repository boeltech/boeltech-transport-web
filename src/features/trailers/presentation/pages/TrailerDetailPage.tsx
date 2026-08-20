/**
 * TrailerDetailPage — redirect legacy /trailers/:id → listado.
 * Si venía con ?edit=true, abre el Sheet de ese remolque.
 */

import { Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  TRAILER_CATALOG_EDIT_PARAM,
  trailerCatalogListHref,
} from "../trailerCatalogSheetParams";

export function TrailerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const wantsEdit = searchParams.get(TRAILER_CATALOG_EDIT_PARAM) === "true";

  if (!id) {
    return <Navigate to="/trailers" replace />;
  }

  return (
    <Navigate
      to={trailerCatalogListHref(wantsEdit ? { editId: id } : undefined)}
      replace
    />
  );
}
