/**
 * ClientDetailPage
 * Clean Architecture - Presentation Layer
 *
 * Detalle canónico: DetailPageShell con stats, alerts, tabs y metadata.
 *
 * Ubicación: src/features/clients/presentation/pages/ClientDetailPage.tsx
 */

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Building2,
  AlertCircle,
  AlertTriangle,
  Route,
  Receipt,
  Timer,
  Wallet,
  Loader2,
} from "lucide-react";
import { DetailPageShell } from "@shared/ui/page-shells";
import { DetailAlertCard, type StatCardProps } from "@shared/ui/data-display";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { useRegimenFiscalLabel } from "@features/catalogs";

import { useClient, useClientAddresses, useUpdateClient } from "../../application";
import type { Client } from "../../domain";
import { getClientDisplayName } from "../../domain";
import {
  ClientActions,
  ClientAddressMasterDetail,
  ClientDetailCommercialTab,
  ClientDetailDataTab,
  ClientForm,
} from "../components";
import {
  getClientTypeConfig,
  getPaymentTermsConfig,
  formatCreditLimit,
} from "../config/clientConfig";
import {
  ClientStatusBadge,
  operationalStatusFromClient,
} from "../config/clientStatusConfig";
import {
  isClientTaxIdFormatSuspicious,
  isCreditExposureUndefinable,
} from "../helpers/clientDetailGuards";
import type { ClientFormData } from "../validation/clientSchema";

// ============================================================================
// HELPERS
// ============================================================================

function buildClientStats(client: Client): StatCardProps[] {
  const tripsPlaceholder = "—";
  const invoicedPlaceholder = "—";
  const daysPayPlaceholder = "—";

  let creditValue: string;
  let creditDescription: string | undefined;
  if (client.paymentTerms === "cash") {
    creditValue = "N/A";
    creditDescription = "Pago de contado";
  } else if (client.creditLimit != null && client.creditLimit > 0) {
    creditValue = formatCreditLimit(client.creditLimit);
    creditDescription = "Límite autorizado";
  } else {
    creditValue = "Sin definir";
    creditDescription = "Registra límite en edición";
  }

  return [
    {
      title: "Viajes activos",
      value: tripsPlaceholder,
      icon: <Route className="h-5 w-5 text-primary" />,
      description: "Integración pendiente",
    },
    {
      title: "Total facturado",
      value: invoicedPlaceholder,
      icon: <Receipt className="h-5 w-5 text-emerald-500" />,
      description: "Integración pendiente",
    },
    {
      title: "Días prom. pago",
      value: daysPayPlaceholder,
      icon: <Timer className="h-5 w-5 text-blue-500" />,
      description: "Histórico de cobranza",
    },
    {
      title: "Crédito disponible",
      value: creditValue,
      icon: <Wallet className="h-5 w-5 text-amber-500" />,
      description: creditDescription,
    },
  ];
}

// ============================================================================
// PAGE
// ============================================================================

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = id ?? "";
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: client,
    isLoading,
    isError,
  } = useClient(clientId || undefined);

  const clientSoftDeleted = Boolean(client?.deletedAt);

  const { label: taxRegimeLabel } = useRegimenFiscalLabel(client?.taxRegime);

  const addressQuery = useClientAddresses(clientId || undefined, {
    enabled: !!clientId,
  });

  // ── Edición vía Sheet ─────────────────────────────────────────────────────
  // Soporta abrir automáticamente con `?edit=true` (preserva bookmarks de
  // la antigua /clients/:id/edit que ahora redirige aquí).
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [formData, setFormData] = useState<ClientFormData | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const updateMutation = useUpdateClient();

  useEffect(() => {
    if (
      searchParams.get("edit") === "true" &&
      client &&
      !clientSoftDeleted &&
      !editSheetOpen
    ) {
      setEditSheetOpen(true);
    }
    // Solo dispara la primera vez que cargamos el cliente con ?edit=true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, clientSoftDeleted]);

  const handleEditSheetOpenChange = useCallback(
    (open: boolean) => {
      setEditSheetOpen(open);
      // Limpia ?edit=true del URL al cerrar para que reload no reabra el sheet.
      if (!open && searchParams.get("edit") === "true") {
        setSearchParams(
          (prev) => {
            const params = new URLSearchParams(prev);
            params.delete("edit");
            return params;
          },
          { replace: true },
        );
      }
    },
    [searchParams, setSearchParams],
  );

  const handleFormChange = useCallback(
    (data: ClientFormData, valid: boolean) => {
      setFormData(data);
      setIsFormValid(valid);
    },
    [],
  );

  const handleSaveEdit = useCallback(() => {
    if (!formData || !isFormValid || !clientId) return;
    updateMutation.mutate(
      {
        clientId,
        data: {
          type: formData.type,
          legalName: formData.legalName,
          tradeName: formData.tradeName || undefined,
          taxId: formData.taxId,
          taxRegime: formData.taxRegime || undefined,
          contactName: formData.contactName || undefined,
          contactPosition: formData.contactPosition || undefined,
          phone: formData.phone || undefined,
          secondaryPhone: formData.secondaryPhone || undefined,
          email: formData.email || undefined,
          billingEmail: formData.billingEmail || undefined,
          paymentTerms: formData.paymentTerms,
          creditDays: formData.creditDays,
          creditLimit: formData.creditLimit,
          notes: formData.notes || undefined,
        },
      },
      {
        onSuccess: () => handleEditSheetOpenChange(false),
      },
    );
  }, [formData, isFormValid, clientId, updateMutation, handleEditSheetOpenChange]);

  const editFormDefaults = useMemo<Partial<ClientFormData> | null>(() => {
    if (!client || clientSoftDeleted) return null;
    return {
      type: client.type,
      legalName: client.legalName,
      tradeName: client.tradeName ?? "",
      taxId: client.taxId,
      taxRegime: client.taxRegime ?? "",
      contactName: client.contactName ?? "",
      contactPosition: client.contactPosition ?? "",
      phone: client.phone ?? "",
      secondaryPhone: client.secondaryPhone ?? "",
      email: client.email ?? "",
      billingEmail: client.billingEmail ?? "",
      paymentTerms: client.paymentTerms,
      creditDays: client.creditDays,
      creditLimit: client.creditLimit ?? undefined,
      notes: client.notes ?? "",
    };
  }, [client, clientSoftDeleted]);

  const clientStats = useMemo((): StatCardProps[] => {
    if (!client || clientSoftDeleted) return [];
    return buildClientStats(client);
  }, [client, clientSoftDeleted]);

  const clientAlerts = useMemo(() => {
    if (!client || clientSoftDeleted) return undefined;

    const cards: ReactElement[] = [];

    const addressesReady =
      addressQuery.isSuccess &&
      addressQuery.data !== undefined &&
      addressQuery.data.length === 0;

    if (addressesReady) {
      cards.push(
        <DetailAlertCard
          key="no-addresses"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Sin direcciones registradas"
          items={[
            {
              text: "Agrega al menos una dirección fiscal o de entrega en la pestaña Direcciones.",
            },
          ]}
        />,
      );
    }

    if (isClientTaxIdFormatSuspicious(client)) {
      cards.push(
        <DetailAlertCard
          key="rfc-suspicious"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title="RFC con formato inconsistente"
          items={[
            {
              text: "Verifica longitud y caracteres del RFC según el tipo de persona (moral 12 · física 13).",
            },
          ]}
        />,
      );
    }

    if (isCreditExposureUndefinable(client)) {
      cards.push(
        <DetailAlertCard
          key="credit-no-limit"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Crédito sin límite definido"
          items={[
            {
              text: "El cliente está en crédito sin límite registrado. Define un monto para control de exposición (sobregiro se reportará con integración de cartera).",
            },
          ]}
        />,
      );
    }

    if (cards.length === 0) return undefined;
    return <div className="space-y-3">{cards}</div>;
  }, [client, clientSoftDeleted, addressQuery.isSuccess, addressQuery.data]);

  if (isLoading) {
    return (
      <DetailPageShell
        className="mx-auto w-full max-w-6xl p-4 sm:p-6"
        isLoading
        header={{
          backHref: "/clients",
          backLabel: "Volver a clientes",
          icon: <Building2 className="h-6 w-6" />,
          iconShape: "circle",
          title: "Cliente",
        }}
      />
    );
  }

  const clientUnavailable = !client || clientSoftDeleted;

  if (isError || clientUnavailable) {
    const wasDeleted = Boolean(client?.deletedAt);
    return (
      <DetailPageShell
        className="mx-auto w-full max-w-6xl p-4 sm:p-6"
        isLoading={false}
        notFound
        notFoundConfig={{
          icon: <AlertCircle />,
          title: wasDeleted ? "Cliente dado de baja" : "Cliente no encontrado",
          description: wasDeleted
            ? "Este cliente fue eliminado del catálogo operativo (baja lógica) y ya no está disponible."
            : "El cliente que buscas no existe o fue eliminado.",
          backHref: "/clients",
          backLabel: "Volver a clientes",
        }}
        header={{
          backHref: "/clients",
          icon: <Building2 className="h-6 w-6" />,
          iconShape: "circle",
          title: "Cliente",
        }}
      />
    );
  }

  const typeConfig = getClientTypeConfig(client.type);
  const paymentConfig = getPaymentTermsConfig(client.paymentTerms);
  const TypeIcon = typeConfig.icon;
  const PaymentIcon = paymentConfig.icon;

  return (
    <>
    <DetailPageShell
      className="mx-auto w-full max-w-6xl p-4 sm:p-6"
      isLoading={false}
      header={{
        backHref: "/clients",
        backLabel: "Volver a clientes",
        icon: <TypeIcon className={cn("h-6 w-6", typeConfig.color)} />,
        iconVariant: client.isActive ? "primary" : "muted",
        iconShape: client.type === "individual" ? "circle" : "rounded",
        title: getClientDisplayName(client),
        subtitle: `${client.clientCode} · ${typeConfig.label}`,
        statusBadge: (
          <ClientStatusBadge
            status={operationalStatusFromClient(client.isActive)}
            showIcon
            size="sm"
          />
        ),
        actions: (
          <ClientActions
            client={client}
            variant="buttons"
            onEdit={() => setEditSheetOpen(true)}
          />
        ),
      }}
      alerts={clientAlerts}
      stats={clientStats}
      tabs={{
        defaultValue: "informacion",
        items: [
          {
            value: "informacion",
            label: "Información",
            content: (
              <ClientDetailDataTab
                client={client}
                taxRegimeLabel={taxRegimeLabel}
              />
            ),
          },
          {
            value: "terminos_comerciales",
            label: "Términos comerciales",
            content: (
              <ClientDetailCommercialTab
                client={client}
                paymentConfig={paymentConfig}
                PaymentIcon={PaymentIcon}
              />
            ),
          },
          {
            value: "addresses",
            label: "Direcciones",
            content: (
              <ClientAddressMasterDetail
                clientId={client.id}
                clientRfc={client.taxId}
                clientName={client.legalName}
              />
            ),
          },
        ],
      }}
      metadata={{
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        createdBy: client.createdBy ?? undefined,
      }}
    />

    {/* ============================================================ */}
    {/* SHEET: edición contextual del cliente                         */}
    {/* ============================================================ */}
    <Sheet open={editSheetOpen} onOpenChange={handleEditSheetOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Editar cliente</SheetTitle>
          <SheetDescription>{getClientDisplayName(client)}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {editFormDefaults ? (
            <ClientForm
              defaultValues={editFormDefaults}
              onChange={handleFormChange}
              disabled={updateMutation.isPending}
            />
          ) : null}
        </div>

        <SheetFooter className="border-t bg-background px-6 py-4">
          <Button
            variant="outline"
            onClick={() => handleEditSheetOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={!isFormValid || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  );
}

export default ClientDetailPage;
