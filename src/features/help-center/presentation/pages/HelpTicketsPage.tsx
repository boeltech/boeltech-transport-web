import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TicketPlus } from "lucide-react";
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
import { TicketStatusBadge } from "../components/TicketStatusBadge";

const copy = helpCenterCopy.tickets;
const colCopy = copy.columns;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function HelpTicketsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const filters = useMemo(() => ({ page, pageSize: 20 }), [page]);

  const { data, isLoading } = useHelpTickets(filters);

  const items = data?.items ?? [];

  return (
    <ListPageShell<HelpTicketListItem>
      title={copy.title}
      description={copy.description}
      isLoading={isLoading}
      items={items}
      entityLabelPlural="tickets"
      emptyState={{
        icon: <TicketPlus className="h-10 w-10" />,
        title: copy.emptyTitle,
        description: copy.emptyDescription,
      }}
      pagination={
        data
          ? {
              page: data.page,
              totalPages: data.totalPages,
              total: data.total,
              limit: data.pageSize,
            }
          : undefined
      }
      onPageChange={setPage}
      renderTable={() => (
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
      )}
    />
  );
}

export default HelpTicketsPage;
