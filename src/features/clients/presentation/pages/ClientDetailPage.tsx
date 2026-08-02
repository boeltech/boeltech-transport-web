/**
 * ClientDetailPage
 * Clean Architecture - Presentation Layer
 *
 * Detalle canónico: DetailPageShell con stats, alerts, tabs y metadata.
 * Tabs: Cliente · Contactos · Direcciones · Viajes.
 * Crédito solo en bloque comercial + alerts de riesgo (sin StatCard).
 *
 * Ubicación: src/features/clients/presentation/pages/ClientDetailPage.tsx
 */

import { useMemo, type ReactElement } from "react";
import { useParams } from "react-router-dom";
import {
  Building2,
  AlertCircle,
  AlertTriangle,
  Route,
  Receipt,
  Timer,
  CalendarDays,
} from "lucide-react";
import { useTabParam } from "@shared/hooks";
import { DetailPageShell } from "@shared/ui/page-shells";
import { DetailAlertCard, type StatCardProps } from "@shared/ui/data-display";
import { creditExposureCopy } from "@shared/ui/data-display/creditExposureCopy";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { useRegimenFiscalLabel } from "@features/catalogs";

import {
  useClient,
  useClientAddresses,
  useClientSummary,
  useClientCreditSummary,
} from "../../application";
import type { ClientSummary } from "../../domain";
import { getClientDisplayName } from "../../domain";
import {
  ClientActions,
  ClientAddressMasterDetail,
  ClientContactsMasterDetail,
  ClientDetailCommercialTab,
  ClientDetailDataTab,
  ClientTripHistoryTab,
} from "../components";
import { clientDetailCopy } from "../copy/clientDetailCopy";
import {
  getClientTypeConfig,
  getPaymentTermsConfig,
} from "../config/clientConfig";
import {
  ClientStatusBadge,
  operationalStatusFromClient,
} from "../config/clientStatusConfig";
import {
  isClientTaxIdFormatSuspicious,
  isCreditExposureUndefinable,
} from "../helpers/clientDetailGuards";

const TAB = {
  client: "client",
  contacts: "contacts",
  addresses: "addresses",
  trips: "trips",
} as const;

const CLIENT_DETAIL_TABS = [
  TAB.client,
  TAB.contacts,
  TAB.addresses,
  TAB.trips,
] as const;

const copy = clientDetailCopy;

// ============================================================================
// HELPERS
// ============================================================================

function buildClientStats(
  summary: ClientSummary | undefined,
  summaryLoading: boolean,
): StatCardProps[] {
  const statsCopy = copy.stats;

  const lastTripValue = summaryLoading
    ? "…"
    : summary?.lastTripAt
      ? formatDate(summary.lastTripAt)
      : "—";

  return [
    {
      title: statsCopy.activeTrips,
      value: summaryLoading ? "…" : (summary?.activeTrips ?? "—"),
      tone: "primary",
      icon: <Route className="h-5 w-5" />,
      tooltip: statsCopy.operationalHint,
    },
    {
      title: statsCopy.lastTrip,
      value: lastTripValue,
      tone: "neutral",
      icon: <CalendarDays className="h-5 w-5" />,
      description:
        !summaryLoading && !summary?.lastTripAt
          ? statsCopy.lastTripEmpty
          : undefined,
    },
    {
      title: statsCopy.revenue,
      value: summaryLoading
        ? "…"
        : summary != null
          ? formatMxCurrency(summary.totalRevenue)
          : "—",
      tone: "success",
      icon: <Receipt className="h-5 w-5" />,
      tooltip: statsCopy.revenueTooltip,
    },
    {
      title: statsCopy.avgPaymentDays,
      value: summaryLoading
        ? "…"
        : summary?.avgPaymentDays != null
          ? `${Math.round(summary.avgPaymentDays)} d`
          : "—",
      tone: "info",
      icon: <Timer className="h-5 w-5" />,
      description:
        summary?.avgPaymentDays != null
          ? statsCopy.avgPaymentHint
          : statsCopy.noPayments,
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

  const { label: taxRegimeLabel } = useRegimenFiscalLabel(client?.taxRegime, {
    format: "name",
  });

  const addressQuery = useClientAddresses(clientId || undefined, {
    enabled: !!clientId && !clientUnavailable,
  });

  const summaryQuery = useClientSummary(clientId || undefined, {
    enabled: !!clientId && !clientUnavailable,
  });

  const creditSummaryQuery = useClientCreditSummary(clientId || undefined, undefined, {
    enabled: !!clientId && !clientUnavailable,
  });

  const { activeTab, setActiveTab } = useTabParam(
    CLIENT_DETAIL_TABS,
    TAB.client,
  );

  const clientStats = useMemo((): StatCardProps[] => {
    if (!client) return [];
    return buildClientStats(summaryQuery.data, summaryQuery.isLoading);
  }, [client, summaryQuery.data, summaryQuery.isLoading]);

  const clientAlerts = useMemo(() => {
    if (!client) return undefined;

    const cards: ReactElement[] = [];
    const creditSummary = creditSummaryQuery.data;

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
          title={copy.alerts.noAddresses.title}
        >
          <p>{copy.alerts.noAddresses.text}</p>
          <div className="mt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setActiveTab(TAB.addresses)}
            >
              {copy.alerts.noAddresses.goToAddresses}
            </Button>
          </div>
        </DetailAlertCard>,
      );
    }

    if (isClientTaxIdFormatSuspicious(client)) {
      cards.push(
        <DetailAlertCard
          key="rfc-suspicious"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={copy.alerts.rfcSuspicious.title}
          items={[{ text: copy.alerts.rfcSuspicious.text }]}
        />,
      );
    }

    if (isCreditExposureUndefinable(client)) {
      cards.push(
        <DetailAlertCard
          key="credit-no-limit"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={copy.alerts.creditNoLimit.title}
          items={[{ text: copy.alerts.creditNoLimit.text }]}
        />,
      );
    } else if (creditSummary?.status === "warn") {
      cards.push(
        <DetailAlertCard
          key="credit-warn"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={creditExposureCopy.alerts.warnTitle}
          items={[{ text: creditExposureCopy.alerts.warnBody }]}
        />,
      );
    } else if (creditSummary?.status === "exceeded") {
      cards.push(
        <DetailAlertCard
          key="credit-exceeded"
          severity="critical"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={creditExposureCopy.alerts.exceededTitle}
          items={[{ text: creditExposureCopy.alerts.exceededBody }]}
        />,
      );
    }

    if (cards.length === 0) return undefined;
    return <div className="space-y-3">{cards}</div>;
  }, [
    client,
    addressQuery.isSuccess,
    addressQuery.data,
    creditSummaryQuery.data,
    setActiveTab,
  ]);

  if (isLoading) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref: "/clients",
          icon: <Building2 className="h-6 w-6" />,
          title: copy.title.fallback,
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
          title: copy.state.notFoundTitle,
          description: copy.state.notFoundDescription,
          backHref: "/clients",
          backLabel: copy.state.backToList,
        }}
        header={{
          backHref: "/clients",
          icon: <Building2 className="h-6 w-6" />,
          title: copy.title.fallback,
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
        defaultValue: TAB.client,
        value: activeTab,
        onValueChange: setActiveTab,
        items: [
          {
            value: TAB.client,
            label: copy.tabs.client,
            content: (
              <ClientDetailDataTab
                client={client}
                taxRegimeLabel={taxRegimeLabel}
                onGoToContacts={() => setActiveTab(TAB.contacts)}
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
            value: TAB.contacts,
            label: copy.tabs.contacts,
            content: <ClientContactsMasterDetail clientId={client.id} />,
          },
          {
            value: TAB.addresses,
            label: copy.tabs.addresses,
            content: (
              <ClientAddressMasterDetail
                clientId={client.id}
                clientRfc={client.taxId}
                clientName={client.legalName}
              />
            ),
          },
          {
            value: TAB.trips,
            label: copy.tabs.trips,
            content: <ClientTripHistoryTab clientId={client.id} />,
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
