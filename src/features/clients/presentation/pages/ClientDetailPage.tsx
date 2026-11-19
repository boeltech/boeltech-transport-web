/**
 * ClientDetailPage
 * Clean Architecture - Presentation Layer
 *
 * Detalle canónico: DetailPageShell con stats, alerts, tabs y metadata.
 * Tabs: Datos · Contactos · Direcciones · Viajes.
 * Crédito solo en bloque comercial + alerts de riesgo (sin StatCard).
 *
 * Ubicación: src/features/clients/presentation/pages/ClientDetailPage.tsx
 */

import { useCallback, useMemo, type ReactElement } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GENERIC_RECEIVER_TAX_REGIME } from "@boeltech/cfdi-domain";
import {
  MODULE_LIST_PATH_LABELS,
  resolveDetailCrumbs,
  useMasterActionFrom,
} from "@shared/utils/masterWayfinding";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import {
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
import { Badge } from "@shared/ui/badge";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { useRegimenFiscalLabel } from "@features/catalogs";
import { useReceiverFiscalCatalogLabels } from "@features/catalogs/application";
import { useBillingSchemes } from "@features/settings/application/hooks/useBillingSchemes";
import { formatBillingSchemeCadenceSummary } from "@features/settings/presentation/utils/formatBillingSchemeCadence";
import { usePermissions } from "@shared/permissions";

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
  ClientDetailHeaderSubtitle,
  ClientOperationalReceiptBatchDeepLinkHost,
  ClientTripHistoryTab,
} from "../components";
import { clientDetailCopy } from "../copy/clientDetailCopy";
import { cfdiReceptorProfileCopy } from "../copy/cfdiReceptorProfileCopy";
import {
  getClientTypeConfig,
  getPaymentTermsConfig,
} from "../config/clientConfig";
import { clientAddressAlertFlags } from "../config/clientAddressPurpose";
import {
  ClientStatusBadge,
  operationalStatusFromClient,
} from "../config/clientStatusConfig";
import { clientGenericRfcCopy } from "../copy/clientGenericRfcCopy";
import {
  genericRfcTaxRegimeMismatch,
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
const genericCopy = clientGenericRfcCopy.detail;
const CLIENTS_LIST_PATH = "/clients";
const CLIENTS_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[CLIENTS_LIST_PATH] ?? "Clientes";

function useClientDetailCrumbs(currentLabel: string) {
  const incoming = useIncomingWayfinding();
  return resolveDetailCrumbs({
    from: incoming?.from,
    fromLabel: incoming?.fromLabel,
    module: { listPath: CLIENTS_LIST_PATH, label: CLIENTS_MODULE_LABEL },
    current: { label: currentLabel },
  });
}

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
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("clients", "update");

  const {
    data: client,
    isLoading,
    isError,
  } = useClient(clientId || undefined);

  const clientUnavailable = !client;
  const crumbs = useClientDetailCrumbs(
    client ? getClientDisplayName(client) : copy.title.fallback,
  );

  const { label: taxRegimeLabel } = useRegimenFiscalLabel(client?.taxRegime, {
    format: "name",
  });
  const { taxRegimeLabel: taxRegimeCatalogLabel } =
    useReceiverFiscalCatalogLabels(
      client != null && genericRfcTaxRegimeMismatch(client) != null,
    );
  const navigate = useNavigate();
  const fromState = useMasterActionFrom("/clients");

  const { data: billingSchemes = [] } = useBillingSchemes();
  const billingScheme = useMemo(() => {
    if (!client?.billingSchemeId) return null;
    return billingSchemes.find((s) => s.id === client.billingSchemeId) ?? null;
  }, [billingSchemes, client]);
  const billingSchemeLabel = billingScheme?.name ?? null;
  const billingSchemeCadence = billingScheme
    ? formatBillingSchemeCadenceSummary(billingScheme)
    : null;

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

  /** A3: deep-link `?batch=` aterriza en tab Datos (comercial). */
  const ensureDatosTabForBatch = useCallback(() => {
    if (activeTab !== TAB.client) setActiveTab(TAB.client);
  }, [activeTab, setActiveTab]);

  const clientStats = useMemo((): StatCardProps[] => {
    if (!client) return [];
    return buildClientStats(summaryQuery.data, summaryQuery.isLoading);
  }, [client, summaryQuery.data, summaryQuery.isLoading]);

  /* collectHref retired C15: cobro vive en «Por cobrar». */

  const clientAlerts = useMemo(() => {
    if (!client) return undefined;

    const cards: ReactElement[] = [];
    const creditSummary = creditSummaryQuery.data;
    const goToEdit = () =>
      navigate(`/clients/${client.id}/edit`, { state: fromState });
    const editAction = canUpdate ? (
      <Button type="button" size="sm" variant="outline" onClick={goToEdit}>
        {copy.actions.edit}
      </Button>
    ) : null;
    /* C15: cobro vive solo en «Por cobrar»; crédito sin CTAs de cobro. */
    const creditRiskAction = editAction;

    const addressesReady =
      addressQuery.isSuccess && addressQuery.data !== undefined;
    const alertFlags = addressesReady
      ? clientAddressAlertFlags(addressQuery.data)
      : null;

    // ADR-0096: Solo comercial no emite CFDI — no pedir domicilio fiscal / CP de facturación.
    if (
      client.cfdiReceptorProfile !== "comercial_only" &&
      alertFlags?.missingBillingCp
    ) {
      cards.push(
        <DetailAlertCard
          key="missing-billing-cp"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={copy.alerts.missingBillingCp.title}
          items={[{ text: copy.alerts.missingBillingCp.text }]}
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setActiveTab(TAB.addresses)}
            >
              {copy.alerts.missingBillingCp.goToAddresses}
            </Button>
          }
        />,
      );
    }

    if (alertFlags?.noTripPlaces) {
      cards.push(
        <DetailAlertCard
          key="no-trip-places"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={copy.alerts.noTripPlaces.title}
          items={[{ text: copy.alerts.noTripPlaces.text }]}
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setActiveTab(TAB.addresses)}
            >
              {copy.alerts.noTripPlaces.goToAddresses}
            </Button>
          }
        />,
      );
    }

    const genericMismatch = genericRfcTaxRegimeMismatch(client);
    if (genericMismatch) {
      cards.push(
        <DetailAlertCard
          key="generic-rfc-tax-regime"
          severity="critical"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={genericCopy.wrongRegimeTitle(genericMismatch.kind)}
          items={[
            {
              text: genericCopy.wrongRegimeText(
                genericMismatch.currentTaxRegime,
                taxRegimeCatalogLabel(GENERIC_RECEIVER_TAX_REGIME),
              ),
            },
          ]}
          action={
            canUpdate ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={goToEdit}
              >
                {genericCopy.wrongRegimeCta}
              </Button>
            ) : null
          }
        />,
      );
    }

    if (
      client.cfdiReceptorProfile !== "comercial_only" &&
      isClientTaxIdFormatSuspicious(client)
    ) {
      cards.push(
        <DetailAlertCard
          key="rfc-suspicious"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={copy.alerts.rfcSuspicious.title}
          items={[{ text: copy.alerts.rfcSuspicious.text }]}
          action={editAction}
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
          action={editAction}
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
          action={creditRiskAction}
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
          action={creditRiskAction}
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
    canUpdate,
    hasPermission,
    navigate,
    fromState,
    taxRegimeCatalogLabel,
  ]);

  if (isLoading) {
    return (
      <>
        <DetailPageShell
          isLoading
          header={{
            crumbs,
            title: copy.title.fallback,
          }}
        />
        <ClientOperationalReceiptBatchDeepLinkHost
          onBatchPresent={ensureDatosTabForBatch}
        />
      </>
    );
  }

  if (isError || clientUnavailable) {
    return (
      <>
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
            crumbs,
            title: copy.title.fallback,
          }}
        />
        <ClientOperationalReceiptBatchDeepLinkHost
          onBatchPresent={ensureDatosTabForBatch}
        />
      </>
    );
  }

  const typeConfig = getClientTypeConfig(client.type);
  const paymentConfig = getPaymentTermsConfig(client.paymentTerms);
  const PaymentIcon = paymentConfig.icon;
  const rfc = (client.taxId ?? "").trim().toUpperCase();
  const isComercialOnly = client.cfdiReceptorProfile === "comercial_only";

  return (
    <>
      <DetailPageShell
        isLoading={false}
        header={{
          crumbs,
          title: (
            <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
              <span className="shrink-0">{getClientDisplayName(client)}</span>
              <ClientStatusBadge
                status={operationalStatusFromClient(client.isActive)}
                showIcon
                size="sm"
              />
              {isComercialOnly ? (
                <Badge variant="secondary" tone="soft" className="text-xs">
                  {cfdiReceptorProfileCopy.badge.comercialOnly}
                </Badge>
              ) : null}
            </span>
          ),
          subtitle: (
            <ClientDetailHeaderSubtitle
              clientCode={client.clientCode}
              typeLabel={typeConfig.label}
              rfc={rfc}
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
                  billingSchemeLabel={billingSchemeLabel}
                  billingSchemeCadence={billingSchemeCadence}
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
              content: (
                <ClientContactsMasterDetail
                  clientId={client.id}
                  readOnly={!canUpdate}
                />
              ),
            },
            {
              value: TAB.addresses,
              label: copy.tabs.addresses,
              content: (
                <ClientAddressMasterDetail
                  clientId={client.id}
                  clientRfc={client.taxId ?? ""}
                  clientName={client.legalName}
                  readOnly={!canUpdate}
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
      <ClientOperationalReceiptBatchDeepLinkHost
        onBatchPresent={ensureDatosTabForBatch}
      />
    </>
  );
}

export default ClientDetailPage;
