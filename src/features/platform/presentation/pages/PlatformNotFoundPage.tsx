import { Link } from "react-router-dom";
import { OpsButton } from "../ops/ui";
import { OpsEmptyState } from "../ops/patterns/OpsEmptyState";

export const PLATFORM_NOT_FOUND_COPY = {
  title: "Esta página no está en la consola",
  description: "La dirección no corresponde a una sección de la consola.",
  action: "Volver a la consola",
} as const;

/**
 * 404 de `/platform/*` dentro del shell Ops. No usa el NotFound del ERP.
 */
export function PlatformNotFoundPage() {
  return (
    <OpsEmptyState
      title={PLATFORM_NOT_FOUND_COPY.title}
      description={PLATFORM_NOT_FOUND_COPY.description}
      action={
        <OpsButton asChild>
          <Link to="/platform">{PLATFORM_NOT_FOUND_COPY.action}</Link>
        </OpsButton>
      }
    />
  );
}
