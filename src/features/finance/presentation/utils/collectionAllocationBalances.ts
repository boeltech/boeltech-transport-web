/**
 * Paridad UX con InvoiceCobrosSection (H3 remediación V5).
 * Cuando allocations traen amount pero REP null, deriva Parcialidad /
 * Saldo antes / Saldo después a partir del total y pagos de la factura.
 */

export type BalancePaymentInput = {
  id: string;
  amountMxn: number;
  paymentDate: string;
  paymentTime: string;
  repImpPagado: number | null;
  repImpSaldoAnt: number | null;
  repImpSaldoInsoluto: number | null;
  repNumParcialidad: number | null;
};

export type ResolvedAllocationRep = {
  installment: number | null;
  balanceBefore: number | null;
  balanceAfter: number | null;
};

export type InvoiceBalanceContext = {
  total: number;
  payments: readonly BalancePaymentInput[];
};

/** Misma lógica que InvoiceCobrosSection.buildBalanceAfterByPayment + saldos/parcialidad. */
export function buildBalancesByPayment(
  payments: readonly BalancePaymentInput[],
  invoiceTotal: number,
): Map<string, { installment: number; balanceBefore: number; balanceAfter: number }> {
  const sorted = [...payments].sort((a, b) => {
    const da = `${a.paymentDate}T${a.paymentTime}`;
    const db = `${b.paymentDate}T${b.paymentTime}`;
    return da.localeCompare(db);
  });
  const map = new Map<
    string,
    { installment: number; balanceBefore: number; balanceAfter: number }
  >();
  let remaining = invoiceTotal;
  sorted.forEach((payment, index) => {
    const abono =
      payment.repImpPagado != null ? payment.repImpPagado : payment.amountMxn;
    const balanceBefore =
      payment.repImpSaldoAnt != null ? payment.repImpSaldoAnt : remaining;
    remaining = Math.max(0, Number((remaining - abono).toFixed(2)));
    const balanceAfter =
      payment.repImpSaldoInsoluto != null
        ? payment.repImpSaldoInsoluto
        : remaining;
    map.set(payment.id, {
      installment:
        payment.repNumParcialidad != null
          ? payment.repNumParcialidad
          : index + 1,
      balanceBefore,
      balanceAfter,
    });
  });
  return map;
}

export function allocationNeedsRepEnrich(allocation: {
  repNumParcialidad: number | null;
  repImpSaldoAnt: number | null;
  repImpSaldoInsoluto: number | null;
}): boolean {
  return (
    allocation.repNumParcialidad == null ||
    allocation.repImpSaldoAnt == null ||
    allocation.repImpSaldoInsoluto == null
  );
}

/**
 * Resuelve columnas Repartido: preferir snapshot REP de la allocation;
 * si falta, contexto de factura (total + pagos); si aún falta, derivar
 * un saldo a partir del otro + amount.
 */
export function resolveAllocationRepFields(
  allocation: {
    amount: number;
    repNumParcialidad: number | null;
    repImpSaldoAnt: number | null;
    repImpSaldoInsoluto: number | null;
  },
  paymentId: string,
  invoice: InvoiceBalanceContext | undefined,
): ResolvedAllocationRep {
  if (
    allocation.repNumParcialidad != null &&
    allocation.repImpSaldoAnt != null &&
    allocation.repImpSaldoInsoluto != null
  ) {
    return {
      installment: allocation.repNumParcialidad,
      balanceBefore: allocation.repImpSaldoAnt,
      balanceAfter: allocation.repImpSaldoInsoluto,
    };
  }

  if (invoice) {
    const resolved = buildBalancesByPayment(
      invoice.payments,
      invoice.total,
    ).get(paymentId);
    if (resolved) {
      return {
        installment: allocation.repNumParcialidad ?? resolved.installment,
        balanceBefore: allocation.repImpSaldoAnt ?? resolved.balanceBefore,
        balanceAfter: allocation.repImpSaldoInsoluto ?? resolved.balanceAfter,
      };
    }
  }

  const amount = allocation.amount;
  let balanceBefore = allocation.repImpSaldoAnt;
  let balanceAfter = allocation.repImpSaldoInsoluto;
  if (balanceBefore != null && balanceAfter == null) {
    balanceAfter = Number((balanceBefore - amount).toFixed(2));
  } else if (balanceAfter != null && balanceBefore == null) {
    balanceBefore = Number((balanceAfter + amount).toFixed(2));
  }

  return {
    installment: allocation.repNumParcialidad,
    balanceBefore,
    balanceAfter,
  };
}
