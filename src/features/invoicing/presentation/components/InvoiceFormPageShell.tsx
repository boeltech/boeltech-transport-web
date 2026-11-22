import type { ReactNode } from "react";
import { Receipt } from "lucide-react";
import type { Crumb } from "@shared/ui/breadcrumbs";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { resolveInvoiceWayfindingBackLabel } from "../utils/invoiceWayfinding";

type InvoiceFormPageShellBase = {
  isLoading?: boolean;
  title: string;
  subtitle?: string;
  /** Badge o acción a la derecha del título (p. ej. alcance de la factura). */
  trailing?: ReactNode;
  children?: ReactNode;
};

/**
 * Staff (NL2/NL4): `crumbs` — sin flecha ni Receipt.
 * Legacy (deprecated): `backHref` — sigue inyectando Receipt hasta cleanup.
 */
export type InvoiceFormPageShellProps = InvoiceFormPageShellBase &
  (
    | {
        crumbs: readonly Crumb[];
        backHref?: undefined;
        backLabel?: undefined;
      }
    | {
        backHref: string;
        backLabel?: string;
        crumbs?: undefined;
      }
  );

export function InvoiceFormPageShell(props: InvoiceFormPageShellProps) {
  const {
    isLoading = false,
    title,
    subtitle,
    trailing,
    children,
  } = props;

  const header =
    "crumbs" in props && props.crumbs != null
      ? {
          crumbs: props.crumbs,
          title,
          subtitle,
          trailing,
        }
      : {
          backHref: props.backHref!,
          backLabel:
            props.backLabel ??
            resolveInvoiceWayfindingBackLabel(props.backHref!),
          icon: <Receipt className="h-5 w-5" />,
          title,
          subtitle,
          trailing,
        };

  return (
    <FormPageShell
      isLoading={isLoading}
      className="mx-auto w-full max-w-6xl"
      header={header}
    >
      {!isLoading ? <div className="w-full">{children}</div> : null}
    </FormPageShell>
  );
}
