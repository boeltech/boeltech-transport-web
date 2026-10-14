import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, Download, FileText, TicketPlus } from "lucide-react";
import config from "@shared/config/env";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { DetailPageShell } from "@shared/ui/page-shells";
import { useToast } from "@shared/hooks";
import { getRoleLabel, isValidRole } from "@shared/constants/roles";
import { resolveDetailQueryErrorState } from "@shared/utils/resolveQueryErrorState";
import { helpCenterApi } from "../../infrastructure";
import { useHelpTicket } from "../../application";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { HelpTicketsPausedView } from "../components/HelpTicketsPausedView";
import { TicketStatusBadge } from "../components/TicketStatusBadge";

const copy = helpCenterCopy.ticketDetail;

function roleLabelAtCreate(role: string): string {
  return isValidRole(role) ? getRoleLabel(role) : role;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function HelpTicketDetailPage() {
  if (!config.help.ticketsEnabled) {
    return <HelpTicketsPausedView />;
  }
  return <HelpTicketDetailPageContent />;
}

function HelpTicketDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const { error: toastError } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch,
  } = useHelpTicket(id!);

  const queryState = resolveDetailQueryErrorState({
    missingId: !id,
    isError,
    error,
    hasData: Boolean(ticket),
  });

  const isLoadError =
    queryState === "serverError" ||
    queryState === "unknownError" ||
    queryState === "missingId";
  const isNotFound =
    !isLoading &&
    (queryState === "notFound" ||
      queryState === "forbidden" ||
      (!ticket && !isError));

  const handleDownload = async (
    attachmentId: string,
    fileName: string,
  ) => {
    if (!id) return;
    setDownloadingId(attachmentId);
    try {
      await helpCenterApi.downloadAttachment(id, attachmentId, fileName);
    } catch {
      toastError(copy.downloadError);
    } finally {
      setDownloadingId(null);
    }
  };

  if (!isLoading && isLoadError) {
    return (
      <DetailPageShell
        isLoading={false}
        header={{
          backHref: "/ayuda/tickets",
          backLabel: copy.backLabel,
          icon: <TicketPlus className="h-6 w-6" />,
          title: copy.backLabel,
        }}
        alerts={
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
        }
      />
    );
  }

  return (
    <DetailPageShell
      isLoading={isLoading}
      notFound={isNotFound}
      notFoundConfig={{
        icon: <TicketPlus className="h-10 w-10" />,
        title: copy.notFoundTitle,
        description: copy.notFoundDescription,
        backHref: "/ayuda/tickets",
        backLabel: copy.notFoundAction,
      }}
      header={{
        backHref: "/ayuda/tickets",
        backLabel: copy.backLabel,
        icon: <TicketPlus className="h-6 w-6" />,
        title: copy.title,
        subtitle: ticket ? formatDate(ticket.createdAt) : undefined,
        statusBadge: ticket ? (
          <TicketStatusBadge status={ticket.status} />
        ) : undefined,
      }}
    >
      {ticket && (
        <div className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.contextSection}
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="font-medium text-muted-foreground">
                {copy.pageLabel}
              </dt>
              <dd className="font-mono text-xs">{ticket.route}</dd>

              {ticket.articleTitle && (
                <>
                  <dt className="font-medium text-muted-foreground">
                    {copy.articleLabel}
                  </dt>
                  <dd>
                    <Link
                      to={`/ayuda/${ticket.articleId}`}
                      className="text-primary hover:underline"
                    >
                      {ticket.articleTitle}
                    </Link>
                  </dd>
                </>
              )}

              <dt className="font-medium text-muted-foreground">
                {copy.roleLabel}
              </dt>
              <dd>{roleLabelAtCreate(ticket.roleAtCreate)}</dd>
            </dl>
          </section>

          {ticket.messages.map((msg) => (
            <section key={msg.id} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.messageSection}
              </h2>
              <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                {msg.body}
              </div>

              {msg.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {copy.attachmentsSection}
                  </h3>
                  {msg.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {att.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(att.fileSize)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={downloadingId === att.id}
                        onClick={() =>
                          void handleDownload(att.id, att.fileName)
                        }
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        {copy.download}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </DetailPageShell>
  );
}

export default HelpTicketDetailPage;
