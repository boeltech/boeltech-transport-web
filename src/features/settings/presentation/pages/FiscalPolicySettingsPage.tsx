/**
 * Política de Sin factura (D11). Tres modos; solo admin guarda.
 */
import { useState } from "react";
import { SIN_CFDI_MODES, type SinCfdiMode } from "@boeltech/cfdi-domain";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { SettingsPageShell } from "@shared/ui/page-shells";
import { Skeleton } from "@shared/ui/skeleton";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { formatDateTime } from "@shared/utils/dateUtils";
import { useFiscalPolicy, useUpdateFiscalPolicy } from "../../application";
import type { FiscalPolicy } from "../../infrastructure/fiscalPolicyApi";

const MODE_COPY: Record<SinCfdiMode, { label: string; description: string }> = {
  disabled: {
    label: "No permitido",
    description: "Ningún viaje puede quedar sin CFDI.",
  },
  comercial_only_clients: {
    label: "Solo clientes Sin factura",
    description:
      "Un cliente Con factura necesita autorización para dejar el viaje sin CFDI.",
  },
  allowed_with_override: {
    label: "Permitido, con motivo",
    description:
      "Se puede pasar un viaje a Sin factura con un motivo. Si la regla no pide autorización, aplica al momento.",
  },
};

/** Línea de auditoría. Null si nadie ha hecho PUT (`updatedBy` null). */
function formatLastChange(policy: FiscalPolicy): string | null {
  if (policy.updatedBy == null) return null;
  const name = policy.updatedByName?.trim() || null;
  const when =
    typeof policy.updatedAt === "string" && policy.updatedAt.trim() !== ""
      ? formatDateTime(policy.updatedAt)
      : "";
  const whenLabel = when !== "" && when !== "—" ? when : "";
  if (name && whenLabel) return `Último cambio: ${name} · ${whenLabel}`;
  if (name) return `Último cambio: ${name}`;
  if (whenLabel) return `Último cambio · ${whenLabel}`;
  return "Último cambio";
}

export function FiscalPolicySettingsPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("fiscal_policy", "update");
  const policy = useFiscalPolicy();
  const update = useUpdateFiscalPolicy();
  const [draft, setDraft] = useState<SinCfdiMode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selected = draft ?? policy.data?.sinCfdiMode ?? null;
  const dirty = selected != null && selected !== policy.data?.sinCfdiMode;
  const lastChange = policy.data ? formatLastChange(policy.data) : null;

  async function save() {
    if (!selected || !dirty) return;
    setErrorMessage(null);
    try {
      await update.mutateAsync(selected);
      setDraft(null);
      toast({
        title: "Política fiscal actualizada",
        variant: "success",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la política.",
      );
    }
  }

  return (
    <SettingsPageShell
      sectionTitle="Sin factura"
      title="Sin factura"
      description="Define si un viaje puede operar sin CFDI."
    >
      {policy.isLoading ? (
        <Skeleton className="h-40 w-full max-w-xl" />
      ) : policy.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se pudo cargar la política.
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-3"
              onClick={() => void policy.refetch()}
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <form
          className="max-w-xl space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {!canUpdate ? (
            <p className="text-sm text-muted-foreground">
              Solo un administrador puede cambiar este modo.
            </p>
          ) : null}
          <fieldset className="space-y-3" disabled={!canUpdate || update.isPending}>
            <legend className="text-sm font-medium">Modo</legend>
            {SIN_CFDI_MODES.map((mode) => {
              const copy = MODE_COPY[mode];
              return (
                <label
                  key={mode}
                  className="flex cursor-pointer gap-3 rounded-md border p-3 has-[:disabled]:cursor-default"
                >
                  <input
                    type="radio"
                    name="sinCfdiMode"
                    value={mode}
                    className="mt-1"
                    checked={selected === mode}
                    onChange={() => {
                      setDraft(mode);
                      setErrorMessage(null);
                    }}
                  />
                  <span>
                    <span className="block text-sm font-medium">{copy.label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {copy.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {lastChange ? (
            <p className="text-sm text-muted-foreground">{lastChange}</p>
          ) : null}
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          {canUpdate ? (
            <Button type="submit" disabled={!dirty || update.isPending}>
              {update.isPending ? "Guardando…" : "Guardar"}
            </Button>
          ) : null}
        </form>
      )}
    </SettingsPageShell>
  );
}
