/**
 * Paleta de búsqueda rápida (⌘K / Ctrl+K).
 *
 * Páginas: usa la misma navegación filtrada que el sidebar (`useNavigation`),
 * así RBAC y reglas por rol (p. ej. Finanzas vs Facturas) permanecen alineadas
 * con la API.
 *
 * Entidades: reutiliza el search de los listados de viajes y facturas, para
 * abrir un viaje por folio desde cualquier pantalla.
 */

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Route } from "lucide-react";

import { useNavigation } from "@widgets/sidebar";
import { useDebounce } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { useTrips } from "@features/trips";
import { useFinanceInvoicesList } from "@features/finance/application";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { DialogTitle } from "@shared/ui/dialog";
import { headerCopy } from "../copy/headerCopy";

const copy = headerCopy.commandMenu;
const MIN_QUERY_LENGTH = 2;
const ENTITY_RESULTS_LIMIT = 5;

export interface GlobalCommandMenuProps {
  open: boolean;
  /** Comparte estado con el padre; permite toggle ⌘K con actualizador funcional. */
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function GlobalCommandMenu({
  open,
  onOpenChange,
}: GlobalCommandMenuProps) {
  const navigate = useNavigate();
  const { navigation } = useNavigation();
  const { hasPermission } = usePermissions();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const search = debouncedQuery.trim();
  const searchEntities = open && search.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setQuery("");
        onOpenChange((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setQuery("");
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const { data: tripResults, isFetching: isFetchingTrips } = useTrips(
    {
      page: 1,
      limit: ENTITY_RESULTS_LIMIT,
      filters: { search },
      sort: { field: "scheduled_departure", direction: "desc" },
    },
    { enabled: searchEntities && hasPermission("trips", "read") },
  );

  const { data: invoiceResults, isFetching: isFetchingInvoices } =
    useFinanceInvoicesList(
      { search, page: 1, limit: ENTITY_RESULTS_LIMIT },
      { enabled: searchEntities && hasPermission("invoices", "read") },
    );

  const runNavigate = useCallback(
    (path: string) => {
      setQuery("");
      onOpenChange(false);
      navigate(path);
    },
    [navigate, onOpenChange],
  );

  const trips = searchEntities ? (tripResults?.data ?? []) : [];
  const invoices = searchEntities ? (invoiceResults?.data ?? []) : [];
  const isSearching =
    searchEntities && (isFetchingTrips || isFetchingInvoices);

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <DialogTitle className="sr-only">{copy.title}</DialogTitle>
      <CommandInput
        placeholder={copy.placeholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{isSearching ? copy.searching : copy.empty}</CommandEmpty>

        {navigation.map((group) => (
          <CommandGroup
            key={group.id}
            heading={group.title.trim().length > 0 ? group.title : undefined}
          >
            {group.items
              .filter((item) => !item.disabled)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`${group.id}-${item.id}`}
                    value={`${item.label} ${group.title} ${item.path}`}
                    onSelect={() => runNavigate(item.path)}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                  </CommandItem>
                );
              })}
          </CommandGroup>
        ))}

        {trips.length > 0 ? (
          <CommandGroup heading={copy.groups.trips}>
            {trips.map((trip) => (
              <CommandItem
                key={trip.id}
                /* La query va en el value: los resultados vienen del API y el
                   filtro local de cmdk no debe descartarlos. */
                value={`${trip.tripCode} ${trip.client?.legalName ?? ""} ${search}`}
                onSelect={() => runNavigate(`/trips/${trip.id}`)}
              >
                <Route className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-sm">
                  {trip.tripCode}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {trip.client?.legalName ?? copy.noClient}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {invoices.length > 0 ? (
          <CommandGroup heading={copy.groups.invoices}>
            {invoices.map((invoice) => (
              <CommandItem
                key={invoice.id}
                value={`${invoice.serie}-${invoice.folio} ${invoice.receiverName} ${search}`}
                onSelect={() => runNavigate(`/invoices/${invoice.id}`)}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-sm">
                  {invoice.serie}-{invoice.folio}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {invoice.receiverName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
