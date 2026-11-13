/**
 * Política de Sin factura (D11). Tres modos; solo admin guarda.
 * R4: confirmación AlertDialog solo al Guardar hacia `disabled`.
 */
import { useState } from "react";
import { SIN_CFDI_MODES, type SinCfdiMode } from "@boeltech/cfdi-domain";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Button } from "@shared/ui/button";
import { SettingsPageShell } from "@shared/ui/page-shells";
import { Skeleton } from "@shared/ui/skeleton";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { formatDateTime } from "@shared/utils/dateUtils";
import { useFiscalPolicy, useUpdateFiscalPolicy } from "../../application";
import type {
  FiscalPolicy,
  FiscalPolicyDisableImpact,
} from "../../infrastructure/fiscalPolicyApi";

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

const DISABLE_WARN_LEAD =
  "Los clientes y viajes Sin factura que ya existen se conservan y se pueden seguir cobrando. A partir de ahora no se podrán dar de alta clientes Sin factura ni viajes Sin factura.";

const DISABLE_WARN_NO_IMPACT =
  "No hay impacto sobre clientes ni solicitudes actuales. El cambio solo afecta altas y excepciones nuevas.";

/** Copy D22 — pluralización ES. */
export function formatDisableWarnClientsLine(n: number): string {
  if (n <= 0) return "No hay clientes Sin factura activos.";
  if (n === 1) {
    return "Hay 1 cliente Sin factura activo. Seguirán visibles; no podrás crear más con ese perfil.";
  }
  return `Hay ${n} clientes Sin factura activos. Seguirán visibles; no podrás crear más con ese perfil.`;
}

/** Copy D22 — pluralización ES. */
export function formatDisableWarnRequestsLine(m: number): string {
  if (m <= 0) return "No hay solicitudes de excepción abiertas.";
  if (m === 1) return "Se cancelará 1 solicitud de excepción abierta.";
  return `Se cancelarán ${m} solicitudes de excepción abiertas.`;
}

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
  const [disableWarnOpen, setDisableWarnOpen] = useState(false);
  const [previewImpact, setPreviewImpact] =
    useState<FiscalPolicyDisableImpact | null>(null);
  const [previewPending, setPreviewPending] = useState(false);

  const selected = draft ?? policy.data?.sinCfdiMode ?? null;
  const dirty = selected != null && selected !== policy.data?.sinCfdiMode;
  const lastChange = policy.data ? formatLastChange(policy.data) : null;
  const busy = previewPending || update.isPending;

  async function persist(mode: SinCfdiMode) {
    try {
      await update.mutateAsync(mode);
      setDraft(null);
      setDisableWarnOpen(false);
      setPreviewImpact(null);
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

  async function save() {
    if (!selected || !dirty || !policy.data) return;
    setErrorMessage(null);

    const needsDisableWarn =
      selected === "disabled" && policy.data.sinCfdiMode !== "disabled";

    if (needsDisableWarn) {
      setPreviewPending(true);
      try {
        const result = await policy.refetch();
        if (result.isError || !result.data) {
          setErrorMessage("No se pudo calcular el impacto.");
          return;
        }
        setPreviewImpact(result.data.disableImpact);
        setDisableWarnOpen(true);
      } catch {
        setErrorMessage("No se pudo calcular el impacto.");
      } finally {
        setPreviewPending(false);
      }
      return;
    }

    await persist(selected);
  }

  function closeDisableWarn() {
    if (update.isPending) return;
    setDisableWarnOpen(false);
  }

  const impact = previewImpact;
  const n = impact?.comercialOnlyClients ?? 0;
  const m = impact?.openExceptionRequests ?? 0;

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
          <fieldset className="space-y-3" disabled={!canUpdate || busy}>
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
            <Button type="submit" disabled={!dirty || busy}>
              {previewPending
                ? "Calculando impacto…"
                : update.isPending
                  ? "Guardando…"
                  : "Guardar"}
            </Button>
          ) : null}
        </form>
      )}

      <AlertDialog
        open={disableWarnOpen}
        onOpenChange={(open) => {
          if (!open) closeDisableWarn();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Pasar a «No permitido»?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">{DISABLE_WARN_LEAD}</span>
              <span className="block">{formatDisableWarnClientsLine(n)}</span>
              <span className="block">{formatDisableWarnRequestsLine(m)}</span>
              {n === 0 && m === 0 ? (
                <span className="block">{DISABLE_WARN_NO_IMPACT}</span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={update.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={update.isPending}
              onClick={() => void persist("disabled")}
            >
              {update.isPending ? "Guardando…" : "Pasar a No permitido"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsPageShell>
  );
}
