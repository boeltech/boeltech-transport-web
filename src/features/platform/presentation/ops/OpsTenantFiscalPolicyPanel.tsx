/**
 * Fila de solo lectura del modo Sin factura en el resumen del tenant (D12).
 */
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "../../infrastructure/platformApi";
import { OpsPanel, OpsPanelBody, OpsPanelHeader, OpsPanelTitle } from "./ui/OpsPanel";

const MODE_LABEL: Record<string, string> = {
  disabled: "No permitido",
  comercial_only_clients: "Solo clientes Sin factura",
  allowed_with_override: "Permitido, con motivo",
};

export function OpsTenantFiscalPolicyPanel({ tenantId }: { tenantId: string }) {
  const policy = useQuery({
    queryKey: ["platform", "tenant", tenantId, "fiscal-policy"],
    queryFn: () => platformApi.getTenantFiscalPolicy(tenantId),
  });

  const label = policy.data
    ? (MODE_LABEL[policy.data.sinCfdiMode] ?? policy.data.sinCfdiMode)
    : null;

  return (
    <OpsPanel>
      <OpsPanelHeader>
        <OpsPanelTitle>Sin factura</OpsPanelTitle>
      </OpsPanelHeader>
      <OpsPanelBody>
        {policy.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : policy.isError ? (
          <p className="text-sm text-muted-foreground">
            No se pudo leer la política de Sin factura.
          </p>
        ) : (
          <p className="text-sm">{label}</p>
        )}
      </OpsPanelBody>
    </OpsPanel>
  );
}
