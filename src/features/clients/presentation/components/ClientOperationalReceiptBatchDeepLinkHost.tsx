/**
 * Host deep-link hoja «Cobro» en ficha cliente (F3).
 * Soporta `?batch=` · `?payment=` · `?receipt=`.
 * Vive fuera de la card de saldo: monta aunque la card haga `return null`.
 */

import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  COLLECTION_PAYMENT_PARAM,
  COLLECTION_RECEIPT_PARAM,
  OPERATIONAL_RECEIPT_BATCH_PARAM,
} from "@features/finance/application";
import type { CollectionDetailTarget } from "@features/finance/domain";
import { CollectionDetailSheet } from "@features/finance/presentation/components";

/** UUID canónico (RFC 4122 variant/version bits). */
const ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseId(raw: string | null): string | null {
  if (!raw) return null;
  return ID_RE.test(raw) ? raw : null;
}

const COLLECTION_PARAMS = [
  OPERATIONAL_RECEIPT_BATCH_PARAM,
  COLLECTION_PAYMENT_PARAM,
  COLLECTION_RECEIPT_PARAM,
] as const;

export interface ClientOperationalReceiptBatchDeepLinkHostProps {
  /** Fuerza tab Datos al aterrizar con deep-link de cobro. */
  onBatchPresent?: () => void;
}

export function ClientOperationalReceiptBatchDeepLinkHost({
  onBatchPresent,
}: ClientOperationalReceiptBatchDeepLinkHostProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawBatch = searchParams.get(OPERATIONAL_RECEIPT_BATCH_PARAM);
  const rawPayment = searchParams.get(COLLECTION_PAYMENT_PARAM);
  const rawReceipt = searchParams.get(COLLECTION_RECEIPT_PARAM);

  const batchId = parseId(rawBatch);
  const paymentId = parseId(rawPayment);
  const receiptId = parseId(rawReceipt);

  const target: CollectionDetailTarget | null = useMemo(() => {
    if (paymentId) return { kind: "payment", paymentId };
    if (batchId) return { kind: "batch", batchId };
    if (receiptId) return { kind: "receipt", receiptId };
    return null;
  }, [paymentId, batchId, receiptId]);

  useEffect(() => {
    const invalids: string[] = [];
    if (rawBatch != null && batchId == null) {
      invalids.push(OPERATIONAL_RECEIPT_BATCH_PARAM);
    }
    if (rawPayment != null && paymentId == null) {
      invalids.push(COLLECTION_PAYMENT_PARAM);
    }
    if (rawReceipt != null && receiptId == null) {
      invalids.push(COLLECTION_RECEIPT_PARAM);
    }
    if (invalids.length === 0) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        let changed = false;
        for (const key of invalids) {
          if (next.has(key)) {
            next.delete(key);
            changed = true;
          }
        }
        return changed ? next : prev;
      },
      { replace: true },
    );
  }, [
    rawBatch,
    rawPayment,
    rawReceipt,
    batchId,
    paymentId,
    receiptId,
    setSearchParams,
  ]);

  useEffect(() => {
    if (target) onBatchPresent?.();
  }, [target, onBatchPresent]);

  const clearParams = useCallback(() => {
    setSearchParams(
      (prev) => {
        let changed = false;
        const next = new URLSearchParams(prev);
        for (const key of COLLECTION_PARAMS) {
          if (next.has(key)) {
            next.delete(key);
            changed = true;
          }
        }
        return changed ? next : prev;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      clearParams();
    },
    [clearParams],
  );

  const handleNavigateTarget = useCallback(
    (next: CollectionDetailTarget) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          for (const key of COLLECTION_PARAMS) {
            params.delete(key);
          }
          if (next.kind === "payment") {
            params.set(COLLECTION_PAYMENT_PARAM, next.paymentId);
          } else if (next.kind === "batch") {
            params.set(OPERATIONAL_RECEIPT_BATCH_PARAM, next.batchId);
          } else {
            params.set(COLLECTION_RECEIPT_PARAM, next.receiptId);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return (
    <CollectionDetailSheet
      target={target}
      open={Boolean(target)}
      onOpenChange={handleOpenChange}
      onNavigateTarget={handleNavigateTarget}
    />
  );
}
