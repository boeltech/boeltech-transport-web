/**
 * Paleta de búsqueda rápida (⌘K / Ctrl+K).
 *
 * Páginas: usa la misma navegación filtrada que el sidebar (`useNavigation`),
 * así RBAC y reglas por rol (p. ej. Finanzas vs Facturas) permanecen alineadas
 * con la API.
 *
 * Con query vacía: grupo «Frecuentes» (≤6 destinos permitidos) y el resto de
 * páginas sin duplicar esos ids. Con query: búsqueda actual (páginas + entidades + help).
 *
 * Entidades: reutiliza el search de los listados de viajes y facturas, para
 * abrir un viaje por folio desde cualquier pantalla.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleHelp, FileText, Route } from "lucide-react";

import { useNavigation } from "@widgets/sidebar";
import type { NavItem } from "@widgets/sidebar";
import { useDebounce } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { useTrips } from "@features/trips";
import { useFinanceInvoicesList } from "@features/finance/application";
import {
  helpCenterCopy,
  trackHelpSearchPerformed,
  truncateHelpPhrase,
  useHelpArticles,
  useHelpPanelOptional,
} from "@features/help-center";
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
const helpCopy = helpCenterCopy.surfaces;
const MIN_QUERY_LENGTH = 2;
const ENTITY_RESULTS_LIMIT = 5;
const HELP_RESULTS_LIMIT = 8;

/** Destinos frecuentes (orden fijo). Solo se muestran si están en la nav filtrada. */
const FREQUENT_NAV_IDS = [
  "trips",
  "finance-invoiceable",
  "finance-invoices",
  "finance-approvals",
  "clients-list",
  "vehicles",
] as const;

export interface GlobalCommandMenuProps {
  open: boolean;
  /** Comparte estado con el padre; permite toggle ⌘K con actualizador funcional. */
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

function NavCommandItem({
  item,
  groupTitle,
  onSelect,
}: {
  item: NavItem;
  groupTitle: string;
  onSelect: (path: string) => void;
}) {
  const Icon = item.icon;
  return (
    <CommandItem
      value={`${item.label} ${groupTitle} ${item.path}`}
      onSelect={() => onSelect(item.path)}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{item.label}</span>
    </CommandItem>
  );
}

export function GlobalCommandMenu({
  open,
  onOpenChange,
}: GlobalCommandMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigation } = useNavigation();
  const { hasPermission } = usePermissions();
  const { openHelpPanel } = useHelpPanelOptional();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const search = debouncedQuery.trim();
  const isEmptyQuery = query.trim().length === 0;
  const searchEntities = open && search.length >= MIN_QUERY_LENGTH;
  const helpSearchFilters = useMemo(
    () => (search.length >= MIN_QUERY_LENGTH ? { q: search } : {}),
    [search],
  );

  const navItemsById = useMemo(() => {
    const map = new Map<string, NavItem>();
    for (const group of navigation) {
      for (const item of group.items) {
        if (!item.disabled) map.set(item.id, item);
      }
    }
    return map;
  }, [navigation]);

  const frequentItems = useMemo(() => {
    const items: NavItem[] = [];
    for (const id of FREQUENT_NAV_IDS) {
      const item = navItemsById.get(id);
      if (item) items.push(item);
      if (items.length >= 6) break;
    }
    return items;
  }, [navItemsById]);

  const frequentIds = useMemo(
    () => new Set(frequentItems.map((item) => item.id)),
    [frequentItems],
  );

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

  const { data: helpArticles, isFetching: isFetchingHelp } = useHelpArticles(
    helpSearchFilters,
    { enabled: open },
  );

  useEffect(() => {
    if (!open || search.length < MIN_QUERY_LENGTH) return;
    trackHelpSearchPerformed(search, "command", location.pathname);
  }, [open, search, location.pathname]);

  const runNavigate = useCallback(
    (path: string) => {
      setQuery("");
      onOpenChange(false);
      navigate(path);
    },
    [navigate, onOpenChange],
  );

  const runOpenHelpArticle = useCallback(
    (articleId: string) => {
      setQuery("");
      onOpenChange(false);
      if (location.pathname.startsWith("/ayuda")) {
        navigate(`/ayuda/${articleId}`);
        return;
      }
      openHelpPanel({ articleId, expand: true });
    },
    [location.pathname, navigate, onOpenChange, openHelpPanel],
  );

  const trips = searchEntities ? (tripResults?.data ?? []) : [];
  const invoices = searchEntities ? (invoiceResults?.data ?? []) : [];
  const helpItems = (helpArticles ?? []).slice(0, HELP_RESULTS_LIMIT);
  const isSearching =
    searchEntities &&
    (isFetchingTrips || isFetchingInvoices || isFetchingHelp);

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

        {isEmptyQuery && frequentItems.length > 0 ? (
          <CommandGroup heading={copy.groups.frequent}>
            {frequentItems.map((item) => (
              <NavCommandItem
                key={`frequent-${item.id}`}
                item={item}
                groupTitle={copy.groups.frequent}
                onSelect={runNavigate}
              />
            ))}
          </CommandGroup>
        ) : null}

        {navigation.map((group) => {
          const items = group.items.filter((item) => {
            if (item.disabled) return false;
            if (isEmptyQuery && frequentIds.has(item.id)) return false;
            return true;
          });
          if (items.length === 0) return null;

          const heading =
            group.title.trim().length > 0 ? group.title : copy.groups.pages;

          return (
            <CommandGroup key={group.id} heading={heading}>
              {items.map((item) => (
                <NavCommandItem
                  key={`${group.id}-${item.id}`}
                  item={item}
                  groupTitle={group.title}
                  onSelect={runNavigate}
                />
              ))}
            </CommandGroup>
          );
        })}

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

        {helpItems.length > 0 ? (
          <CommandGroup heading={helpCopy.commandGroup}>
            {helpItems.map((article) => (
              <CommandItem
                key={article.id}
                value={`${article.title} ${article.phrase} ${search}`}
                onSelect={() => runOpenHelpArticle(article.id)}
              >
                <CircleHelp className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{article.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {truncateHelpPhrase(article.phrase)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
