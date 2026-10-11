import {
  cloneElement,
  isValidElement,
  useState,
  type MouseEvent,
  type ReactElement,
} from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { financeCopy } from "../copy";
import {
  COBROS_INVOICE_FOLIO_VISIBLE_LIMIT,
  COBROS_INVOICE_NAV_SHEET_THRESHOLD,
  folioLabel,
  invoicePaymentsHref,
  type CobrosInvoiceNavTarget,
} from "../utils/cobrosInvoiceNav";

const copy = financeCopy.cobros.invoiceNav;

function InvoicePickerLinks({
  invoices,
  linkState,
  onNavigate,
  asMenuItems,
}: {
  invoices: readonly CobrosInvoiceNavTarget[];
  linkState?: unknown;
  onNavigate?: () => void;
  asMenuItems?: boolean;
}) {
  return (
    <>
      {invoices.map((invoice) => {
        const label = folioLabel(invoice);
        const link = (
          <Link
            to={invoicePaymentsHref(invoice.id)}
            state={linkState}
            aria-label={copy.openInvoice(label)}
            onClick={onNavigate}
          >
            {label}
          </Link>
        );
        if (asMenuItems) {
          return (
            <DropdownMenuItem key={invoice.id} asChild>
              {link}
            </DropdownMenuItem>
          );
        }
        return (
          <li key={invoice.id}>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              {link}
            </Button>
          </li>
        );
      })}
    </>
  );
}

interface CobrosInvoicePickerProps {
  invoices: readonly CobrosInvoiceNavTarget[];
  linkState?: unknown;
  trigger: ReactElement;
}

/**
 * N>1 invoice picker: DropdownMenu, or Sheet when N ≥ sheet threshold.
 */
export function CobrosInvoicePicker({
  invoices,
  linkState,
  trigger,
}: CobrosInvoicePickerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const useSheet = invoices.length >= COBROS_INVOICE_NAV_SHEET_THRESHOLD;

  if (invoices.length <= 1) return null;

  if (useSheet) {
    const triggerNode = isValidElement(trigger)
      ? cloneElement(trigger, {
          onClick: (event: MouseEvent) => {
            const prior = (
              trigger.props as { onClick?: (e: MouseEvent) => void }
            ).onClick;
            prior?.(event);
            if (!event.defaultPrevented) setSheetOpen(true);
          },
        } as Partial<typeof trigger.props>)
      : trigger;

    return (
      <>
        {triggerNode}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
            <SheetHeader className="shrink-0 space-y-1 border-b px-6 py-4 text-left">
              <SheetTitle>{copy.pickerTitle}</SheetTitle>
              <SheetDescription>{copy.pickerHint}</SheetDescription>
            </SheetHeader>
            <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
              <InvoicePickerLinks
                invoices={invoices}
                linkState={linkState}
                onNavigate={() => setSheetOpen(false)}
              />
            </ul>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel>{copy.pickerTitle}</DropdownMenuLabel>
        <p className="px-2 pb-2 text-xs text-muted-foreground">
          {copy.pickerHint}
        </p>
        <InvoicePickerLinks
          invoices={invoices}
          linkState={linkState}
          asMenuItems
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface CobrosInvoiceNavCtaProps {
  invoices: readonly CobrosInvoiceNavTarget[];
  linkState?: unknown;
  className?: string;
}

/** N=1 «Ir a factura»; N>1 «Ver en factura…» (menu/Sheet). Never auto-nav to [0]. */
export function CobrosInvoiceNavCta({
  invoices,
  linkState,
  className,
}: CobrosInvoiceNavCtaProps) {
  if (invoices.length === 0) return null;

  if (invoices.length === 1) {
    const invoice = invoices[0]!;
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={className}
        asChild
      >
        <Link to={invoicePaymentsHref(invoice.id)} state={linkState}>
          {copy.goToInvoice}
        </Link>
      </Button>
    );
  }

  return (
    <CobrosInvoicePicker
      invoices={invoices}
      linkState={linkState}
      trigger={
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={className}
          aria-label={copy.viewInInvoiceAria}
        >
          {copy.viewInInvoice}
          <ChevronDown className="ml-1 h-3.5 w-3.5" aria-hidden />
        </Button>
      }
    />
  );
}

interface CobrosInvoiceFolioChipsProps {
  invoices: readonly CobrosInvoiceNavTarget[];
  linkState?: unknown;
}

/**
 * Exceptions column: ≤3 folios as links; overflow «+N más» opens the same picker.
 */
export function CobrosInvoiceFolioChips({
  invoices,
  linkState,
}: CobrosInvoiceFolioChipsProps) {
  if (invoices.length === 0) return null;

  const visible = invoices.slice(0, COBROS_INVOICE_FOLIO_VISIBLE_LIMIT);
  const overflow = invoices.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {visible.map((invoice) => {
        const label = folioLabel(invoice);
        return (
          <Link
            key={invoice.id}
            to={invoicePaymentsHref(invoice.id)}
            state={linkState}
            className="font-medium text-primary underline-offset-4 hover:underline"
            aria-label={copy.openInvoice(label)}
          >
            {label}
          </Link>
        );
      })}
      {overflow > 0 ? (
        <CobrosInvoicePicker
          invoices={invoices}
          linkState={linkState}
          trigger={
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              aria-label={copy.viewInInvoiceAria}
            >
              {copy.moreInvoices(overflow)}
            </button>
          }
        />
      ) : null}
    </div>
  );
}
