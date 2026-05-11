/**
 * ClientDetailPage
 * Clean Architecture - Presentation Layer
 *
 * Detalle canónico: DetailPageShell con stats, alerts, tabs y metadata.
 *
 * Ubicación: src/features/clients/presentation/pages/ClientDetailPage.tsx
 */

import { useMemo, useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";
import {
  Building2,
  AlertCircle,
  AlertTriangle,
  Route,
  Receipt,
  Timer,
  Wallet,
} from "lucide-react";
import { DetailPageShell } from "@shared/ui/page-shells";
import { DetailAlertCard, type StatCardProps } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";

import { useRegimenFiscalLabel } from "@features/catalogs";

import { useClient, useClientAddresses } from "../../application";
import type { Client } from "../../domain";
import { getClientDisplayName } from "../../domain";
import {
  ClientActions,
  ClientAddressMasterDetail,
  ClientDetailCommercialTab,
  ClientDetailDataTab,
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
      description: "Próximamente",
    },
    {
      title: "Total facturado",
      value: invoicedPlaceholder,
      icon: <Receipt className="h-5 w-5 text-emerald-500" />,
      description: "Próximamente",
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
  const clientId = id;

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

  const [activeTab, setActiveTab] = useState("informacion");

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
              text: "Agrega al menos una dirección fiscal o de entrega en la pestaña Direcciones asociadas al cliente.",
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
          <ClientActions client={client} variant="buttons" />
        ),
      }}
      alerts={clientAlerts}
      stats={clientStats}
      tabs={{
        defaultValue: "informacion",
        value: activeTab,
        onValueChange: setActiveTab,
        items: [
          {
            value: "informacion",
            label: "Datos del cliente",
            content: (
              <ClientDetailDataTab
                client={client}
                taxRegimeLabel={taxRegimeLabel}
                commercialSection={
                  <ClientDetailCommercialTab
                    client={client}
                    paymentConfig={paymentConfig}
                    PaymentIcon={PaymentIcon}
                  />
                }
              />
            ),
          },
          {
            value: "addresses",
            label: "Direcciones asociadas al cliente",
            content: (
              <ClientAddressMasterDetail
                clientId={client.id}
                clientRfc={client.taxId}
                clientName={client.legalName}
                readOnly
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
    </>
  );
}

export default ClientDetailPage;
