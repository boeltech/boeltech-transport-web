import { useSearchParams } from "react-router-dom";
import { isCompensationCorridorsTab } from "../../application/compensationRoutes";
import { CompensationTemplateListPage } from "./CompensationTemplateListPage";
import { CorridorTariffsListPage } from "./CorridorTariffsListPage";

/**
 * Tarifas List: pestaña Tarifas / Rutas con tarifa fija vía `?tab=routes` (TEC C.2).
 */
export function OperatorPaymentsTariffsPage() {
  const [searchParams] = useSearchParams();
  if (isCompensationCorridorsTab(searchParams.get("tab"))) {
    return <CorridorTariffsListPage />;
  }
  return <CompensationTemplateListPage />;
}
