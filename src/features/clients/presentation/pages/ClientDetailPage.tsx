/**
 * ClientDetailPage
 * Clean Architecture - Presentation Layer
 *
 * Detalle canónico: DetailPageShell con stats, alerts, tabs y metadata.
 * Layout alineado a VehicleDetailPage / DriverDetailPage / TripDetailPage.
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
      value: "—",
      tone: "primary",
      icon: <Route className="h-5 w-5" />,
      description: "Próximamente",
    },
    {
      title: "Total facturado",
      value: "—",
      tone: "success",
      icon: <Receipt className="h-5 w-5" />,
      description: "Próximamente",
    },
    {
      title: "Días prom. pago",
      value: "—",
      tone: "info",
      icon: <Timer className="h-5 w-5" />,
      description: "Histórico de cobranza",
    },
    {
      title: "Crédito disponible",
      value: creditValue,
      tone: "warning",
      icon: <Wallet className="h-5 w-5" />,
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

  const {
    data: client,
    isLoading,
    isError,
  } = useClient(clientId || undefined);

  const clientUnavailable = !client;

  const { label: taxRegimeLabel } = useRegimenFiscalLabel(client?.taxRegime);

  const addressQuery = useClientAddresses(clientId || undefined, {
    enabled: !!clientId && !clientUnavailable,
  });

  const [activeTab, setActiveTab] = useState("informacion");

  const clientStats = useMemo((): StatCardProps[] => {
    if (!client) return [];
    return buildClientStats(client);
  }, [client]);

  const clientAlerts = useMemo(() => {
    if (!client) return undefined;

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
              text: "Agrega al menos una dirección fiscal o de entrega en la pestaña Direcciones o desde Editar cliente.",
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
              text: "El cliente está en crédito sin límite registrado. Define un monto para control de exposición.",
            },
          ]}
        />,
      );
    }

    if (cards.length === 0) return undefined;
    return <div className="space-y-3">{cards}</div>;
  }, [client, addressQuery.isSuccess, addressQuery.data]);

  if (isLoading) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref: "/clients",
          icon: <Building2 className="h-6 w-6" />,
          title: "Cliente",
        }}
      />
    );
  }

  if (isError || clientUnavailable) {
    return (
      <DetailPageShell
        isLoading={false}
        notFound
        notFoundConfig={{
          icon: <AlertCircle />,
          title: "Cliente no encontrado",
          description: "El cliente que buscas no existe o fue eliminado.",
          backHref: "/clients",
          backLabel: "Volver a clientes",
        }}
        header={{
          backHref: "/clients",
          icon: <Building2 className="h-6 w-6" />,
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
    <DetailPageShell
      isLoading={false}
      header={{
        backHref: "/clients",
        icon: <TypeIcon className={cn("h-6 w-6", typeConfig.color)} />,
        iconVariant: client.isActive ? "primary" : "muted",
        iconShape: client.type === "individual" ? "circle" : "rounded",
        title: getClientDisplayName(client),
        subtitle: (
          <>
            <span className="font-mono">{client.clientCode}</span>
            <span className="text-muted-foreground"> · </span>
            <span>{typeConfig.label}</span>
          </>
        ),
        statusBadge: (
          <ClientStatusBadge
            status={operationalStatusFromClient(client.isActive)}
            showIcon
            size="sm"
          />
        ),
        actions: <ClientActions client={client} variant="buttons" />,
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
            label: "Información",
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
        createdBy:
          client.createdByName?.trim() || client.createdBy?.trim() || undefined,
        updatedBy: client.updatedByName?.trim() || undefined,
      }}
    />
  );
}

export default ClientDetailPage;
