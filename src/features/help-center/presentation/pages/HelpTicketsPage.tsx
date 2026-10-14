import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, TicketPlus } from "lucide-react";
import config from "@shared/config/env";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { useHelpTickets } from "../../application";
import type { HelpTicketListItem } from "../../domain";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { CreateTicketSheet } from "../components/CreateTicketSheet";
import { HelpTicketsPausedView } from "../components/HelpTicketsPausedView";
import { TicketStatusBadge } from "../components/TicketStatusBadge";

const copy = helpCenterCopy.tickets;
const createCopy = helpCenterCopy.createTicket;
const colCopy = copy.columns;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function HelpTicketsPage() {
  if (!config.help.ticketsEnabled) {
    return <HelpTicketsPausedView />;
  }
  return <HelpTicketsPageContent />;
}

function HelpTicketsPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const filters = useMemo(() => ({ page, pageSize: 20 }), [page]);

  const { data, isLoading, isError, refetch } = useHelpTickets(filters);

  const items = data?.items ?? [];
  const showLoadError = isError && !isLoading;
  const openCreateSheet = () => setTicketSheetOpen(true);

  return (
    <>
      <ListPageShell<HelpTicketListItem>
        title={copy.title}
        description={copy.description}
        primaryAction={{
          label: createCopy.title,
          icon: <TicketPlus className="h-4 w-4" />,
          onClick: openCreateSheet,
        }}
        isLoading={isLoading || showLoadError}
        items={items}
        entityLabelPlural={copy.entityLabel}
        beforeToolbar={
          showLoadError ? (
            <DetailAlertCard
              severity="critical"
              icon={<AlertCircle className="h-5 w-5" aria-hidden />}
              title={copy.loadErrorTitle}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  {copy.loadErrorRetry}
                </Button>
              }
            >
              <p>{copy.loadErrorDescription}</p>
            </DetailAlertCard>
          ) : null
        }
        emptyState={{
          icon: <TicketPlus className="h-10 w-10" />,
          title: copy.emptyTitle,
          description: copy.emptyDescription,
          cta: {
            label: createCopy.title,
            icon: <TicketPlus className="h-4 w-4" />,
            onClick: openCreateSheet,
          },
        }}
        pagination={
          !showLoadError && data
            ? {
                page: data.page,
                totalPages: data.totalPages,
                total: data.total,
                limit: data.pageSize,
              }
            : undefined
        }
        onPageChange={setPage}
        renderTable={() =>
          showLoadError ? null : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">{colCopy.description}</TableHead>
                  <TableHead>{colCopy.article}</TableHead>
                  <TableHead>{colCopy.status}</TableHead>
                  <TableHead className="text-right">{colCopy.date}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/ayuda/tickets/${ticket.id}`)}
                  >
                    <TableCell>
                      <p className="line-clamp-1 text-sm">{ticket.bodyPreview}</p>
                    </TableCell>
                    <TableCell>
                      {ticket.articleTitle ? (
                        <Link
                          to={`/ayuda/${ticket.articleId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-primary hover:underline"
                        >
                          {ticket.articleTitle}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TicketStatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(ticket.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        }
      />
      <CreateTicketSheet
        open={ticketSheetOpen}
        onOpenChange={setTicketSheetOpen}
        route={location.pathname}
        tenantName={user?.tenant?.name}
      />
    </>
  );
}

export default HelpTicketsPage;
