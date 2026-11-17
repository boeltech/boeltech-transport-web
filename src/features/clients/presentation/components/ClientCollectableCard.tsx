/**
 * Card «Por cobrar» en detalle de cliente (C13/C14/C16, F4 rediseño cobranza).
 * Total + renglones por canal → bandejas; CTA «Registrar cobro»; «Último cobro · Ver».
 *
 * Reemplaza `ClientOperationalCashPendingCard` (sin factura solo).
 * Visibilidad Q11: visible si Sin factura o crédito (saldo 0 OK, sin CTA Registrar);
 * oculta si contado + Con factura + sin saldo.
 */

import { Link, useParams } from "react-router-dom";
import { HandCoins } from "lucide-react";

import { useAuth } from "@features/auth";
import {
  buildClientCollectionPaymentHref,
  buildClientCollectionReceiptHref,
  buildClientOperationalReceiptBatchHref,
  buildFinanceCobrosPath,
  buildFinanceEfectivoPorCobrarPath,
  buildRegisterCollectionPath,
} from "@features/finance/application";
import { isClientPortalRole } from "@shared/constants/roles";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { formatDate } from "@shared/utils/dateUtils";

import type {
  Client,
  ClientByChannel,
  LastCollection,
  CollectionChannel,
} from "../../domain";
import { useLastCollection, useClientByChannel } from "../../application";
import { clientDetailCopy } from "../copy/clientDetailCopy";

const copy = clientDetailCopy.collectable;

/** UUID (or non-empty id) usable in `/clients/:id` deep-links. */
function resolveClientIdForHref(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null") continue;
    return trimmed;
  }
  return null;
}

export interface ClientCollectableCardProps {
  client: Client;
  className?: string;
}

/**
 * Q11 visibility: visible if Sin factura client OR credit payment terms,
 * even with zero balance. Hidden if cash + receptor_cfdi + no balance.
 */
function shouldShowCard(client: Client, byChannel: ClientByChannel | undefined): boolean {
  if (client.cfdiReceptorProfile === "comercial_only") return true;
  if (client.paymentTerms === "credit") return true;
  if (!byChannel) return false;
  return byChannel.withInvoice.balance > 0 || byChannel.withoutInvoice.balance > 0;
}

function preselectChannel(byChannel: ClientByChannel): CollectionChannel | null {
  const wi = byChannel.withInvoice;
  const wo = byChannel.withoutInvoice;
  const bothHaveBalance = wi.balance > 0 && wo.balance > 0;
  if (!bothHaveBalance) {
    if (wi.balance > 0) return "with_invoice";
    if (wo.balance > 0) return "without_invoice";
    return null;
  }
  if (wi.oldestAt && wo.oldestAt) {
    return wo.oldestAt < wi.oldestAt ? "without_invoice" : "with_invoice";
  }
  return "with_invoice";
}

export function ClientCollectableCard({
  client,
  className,
}: ClientCollectableCardProps) {
  const { id: routeClientId } = useParams<{ id: string }>();
  const clientId = resolveClientIdForHref(client.id, routeClientId);
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isPortal = isClientPortalRole(user?.role);
  const canFinanceRead = !isPortal && hasPermission("finance", "read");
  const canFinanceCreate = !isPortal && hasPermission("finance", "create");
  const canOperationalCreate = hasPermission("operational_cash", "create");
  const canSeeCard = canFinanceRead || canOperationalCreate;

  const byChannelQuery = useClientByChannel(clientId ?? "", {
    enabled: canSeeCard && Boolean(clientId),
  });
  const lastCollectionQuery = useLastCollection(clientId ?? "", {
    enabled: canSeeCard && Boolean(clientId),
  });

  if (!canSeeCard) return null;
  if (byChannelQuery.isLoading) return null;

  const byChannel = byChannelQuery.data;
  if (!shouldShowCard(client, byChannel)) return null;

  const wi = byChannel?.withInvoice ?? { balance: 0, count: 0, oldestAt: null };
  const wo = byChannel?.withoutInvoice ?? { balance: 0, count: 0, oldestAt: null };
  const total = wi.balance + wo.balance;

  const bothChannels = wi.balance > 0 && wo.balance > 0;
  const preselected = byChannel ? preselectChannel(byChannel) : null;
  const hasSomethingToCollect = total > 0;
  const lastCollection = lastCollectionQuery.data;

  const canRegister = hasSomethingToCollect && (canFinanceCreate || canOperationalCreate);

  const registerHref =
    canRegister && clientId
      ? buildRegisterCollectionPath({
          channel: preselected ?? "with_invoice",
          clientId,
          from: "client-detail",
        })
      : undefined;

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HandCoins className="h-4 w-4 shrink-0 text-primary" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {copy.totalLabel}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {formatMxCurrency(total)}
          </p>
        </div>

        {(wi.balance > 0 || wo.balance > 0) ? (
          <ul className="space-y-1.5 border-t border-border/60 pt-3">
            {wi.balance > 0 ? (
              <ChannelRow
                label={copy.channelWithInvoice}
                amount={wi.balance}
                detail={wi.oldestAt ? copy.channelSummary(wi.count, formatDate(wi.oldestAt)) : undefined}
                href={canFinanceRead ? buildFinanceCobrosPath(client.taxId) : undefined}
              />
            ) : null}
            {wo.balance > 0 ? (
              <ChannelRow
                label={copy.channelWithoutInvoice}
                amount={wo.balance}
                detail={wo.oldestAt ? copy.channelSummaryTrips(wo.count, formatDate(wo.oldestAt)) : undefined}
                href={
                  canFinanceRead && clientId
                    ? buildFinanceEfectivoPorCobrarPath(clientId)
                    : undefined
                }
              />
            ) : null}
          </ul>
        ) : null}

        {bothChannels && canRegister ? (
          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {copy.whatDoYouCollect}
            </p>
            <div className="flex flex-wrap gap-2">
              {clientId ? (
                <>
                  <ChannelButton
                    label={copy.channelWithInvoice}
                    channel="with_invoice"
                    clientId={clientId}
                    selected={preselected === "with_invoice"}
                  />
                  <ChannelButton
                    label={copy.channelWithoutInvoice}
                    channel="without_invoice"
                    clientId={clientId}
                    selected={preselected === "without_invoice"}
                  />
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2">
          {canRegister && registerHref ? (
            <Button type="button" size="sm" asChild>
              <Link to={registerHref} aria-label={copy.registerCtaAria}>
                {copy.registerCta}
              </Link>
            </Button>
          ) : null}
        </div>

        {lastCollection ? (
          <LastCollectionLine
            clientId={clientId}
            lastCollection={lastCollection}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChannelRow({
  label,
  amount,
  detail,
  href,
}: {
  label: string;
  amount: number;
  detail?: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="text-sm font-medium text-primary underline-offset-2 hover:underline">
        {label} ↗
      </span>
      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
        {formatMxCurrency(amount)}
      </span>
    </>
  );

  return (
    <li>
      {href ? (
        <Link
          to={href}
          className="flex items-baseline justify-between gap-2"
        >
          {content}
        </Link>
      ) : (
        <div className="flex items-baseline justify-between gap-2">
          {content}
        </div>
      )}
      {detail ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </li>
  );
}

function ChannelButton({
  label,
  channel,
  clientId,
  selected,
}: {
  label: string;
  channel: CollectionChannel;
  clientId: string;
  selected: boolean;
}) {
  const href = buildRegisterCollectionPath({
    channel,
    clientId,
    from: "client-detail",
  });

  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "outline"}
      asChild
    >
      <Link to={href}>{label}</Link>
    </Button>
  );
}

function LastCollectionLine({
  clientId,
  lastCollection,
}: {
  clientId: string | null;
  lastCollection: LastCollection;
}) {
  const href = clientId
    ? buildLastCollectionHref(lastCollection, clientId)
    : null;
  return (
    <p className="text-xs text-muted-foreground">
      {copy.lastCollectionPrefix}{" "}
      {formatMxCurrency(lastCollection.amount)} · {formatDate(lastCollection.at)} · {lastCollection.label}
      {href ? (
        <>
          {" · "}
          <Link
            to={href}
            className="font-medium text-primary underline-offset-2 hover:underline"
            aria-label={copy.lastCollectionSeeAria}
          >
            {copy.lastCollectionSee}
          </Link>
        </>
      ) : null}
    </p>
  );
}

/** @internal exported for unit tests */
export function buildLastCollectionHref(
  lc: LastCollection,
  clientId: string,
): string | null {
  const safeClientId = resolveClientIdForHref(clientId);
  if (!safeClientId) return null;

  const ref = lc.ref;
  if (ref.channel === "with_invoice" && ref.paymentId) {
    return buildClientCollectionPaymentHref(safeClientId, ref.paymentId);
  }
  if (ref.channel === "without_invoice") {
    if (ref.kind === "batch" && ref.batchId) {
      return buildClientOperationalReceiptBatchHref(safeClientId, ref.batchId);
    }
    if (ref.kind === "receipt" && ref.receiptId) {
      return buildClientCollectionReceiptHref(safeClientId, ref.receiptId);
    }
  }
  return null;
}
