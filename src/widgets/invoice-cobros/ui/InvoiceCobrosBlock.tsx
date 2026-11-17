/**
 * Composición F3: sección «Cobros de esta factura» + hoja unificada Cobro.
 * Vive en widgets para no cruzar finance ↔ invoicing (ADR-0102).
 */

import { useState } from "react";

import type { CollectionDetailTarget } from "@features/finance/domain";
import { CollectionDetailSheet } from "@features/finance/presentation/components";
import type { Invoice } from "@features/invoicing/domain";
import { InvoiceCobrosSection } from "@features/invoicing/presentation/components";

export interface InvoiceCobrosBlockProps {
  invoice: Invoice;
  canRegister: boolean;
  fromPath?: string;
}

export function InvoiceCobrosBlock({
  invoice,
  canRegister,
  fromPath,
}: InvoiceCobrosBlockProps) {
  const [collectionTarget, setCollectionTarget] =
    useState<CollectionDetailTarget | null>(null);

  return (
    <>
      <InvoiceCobrosSection
        invoice={invoice}
        canRegister={canRegister}
        fromPath={fromPath}
        onViewCobro={(paymentId) =>
          setCollectionTarget({ kind: "payment", paymentId })
        }
      />
      <CollectionDetailSheet
        target={collectionTarget}
        open={collectionTarget != null}
        onOpenChange={(open) => {
          if (!open) setCollectionTarget(null);
        }}
        onNavigateTarget={setCollectionTarget}
      />
    </>
  );
}
