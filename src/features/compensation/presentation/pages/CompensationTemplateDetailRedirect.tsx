import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { resolveCompensationTemplateDetailRedirect } from "../../application/compensationRoutes";

/**
 * Redirect legacy `/finance/compensation/templates/:id` → catálogo (operators Sheet o Builder).
 */
export function CompensationTemplateDetailRedirect() {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const search = searchParams.toString();

  const target = resolveCompensationTemplateDetailRedirect(
    id,
    search ? `?${search}` : "",
  );

  return <Navigate to={target} replace />;
}
