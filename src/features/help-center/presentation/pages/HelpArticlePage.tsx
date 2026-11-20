import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { AlertCircle, BookOpen } from "lucide-react";
import config from "@shared/config/env";
import { Button } from "@shared/ui/button";
import { Card } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { DetailPageShell } from "@shared/ui/page-shells";
import {
  MODULE_LIST_PATH_LABELS,
  resolveDetailCrumbs,
} from "@shared/utils/masterWayfinding";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import { resolveDetailQueryErrorState } from "@shared/utils/resolveQueryErrorState";
import { buildSupportMailto } from "@widgets/header/lib/buildSupportMailto";
import { BRAND } from "@shared/ui/brand";
import { useAuth } from "@/shared/hooks/useAuth";
import { useHelpArticle } from "../../application";
import { trackHelpEvent } from "../../application/trackHelpEvent";
import { markHelpArticleViewed } from "../../infrastructure/helpSessionFlags";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { resolveHelpDisplayGroup } from "../utils/helpDisplayGroup";
import { ArticleFeedback } from "../components/ArticleFeedback";
import { CreateTicketSheet } from "../components/CreateTicketSheet";
import { HelpProblemList } from "../components/HelpProblemList";
import { HelpRichText } from "../components/HelpRichText";
import { HelpRoleChips } from "../components/HelpRoleChips";
import { HelpSteps } from "../components/HelpSteps";

const copy = helpCenterCopy.detail;
const AYUDA_LIST_PATH = "/ayuda";
const AYUDA_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[AYUDA_LIST_PATH] ?? "Ayuda";

export function HelpArticlePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const incoming = useIncomingWayfinding();
  const ticketsEnabled = config.help.ticketsEnabled;
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const {
    data: article,
    isLoading,
    isError,
    error,
    refetch,
  } = useHelpArticle(id!, { enabled: Boolean(id) });

  useEffect(() => {
    if (!article?.id) return;
    const articleId = article.id;
    markHelpArticleViewed(articleId);
    trackHelpEvent({
      eventName: "help_article_viewed",
      articleId,
      route: location.pathname,
      payload: { surface: "page" },
    });
  }, [article?.id, location.pathname]);

  const queryState = resolveDetailQueryErrorState({
    missingId: !id,
    isError,
    error,
    hasData: Boolean(article),
  });

  const isLoadError =
    queryState === "serverError" ||
    queryState === "unknownError" ||
    queryState === "missingId";
  const isNotFound =
    !isLoading &&
    (queryState === "notFound" ||
      queryState === "forbidden" ||
      (!article && !isError));

  const groupLabel = article
    ? (() => {
        const displayGroup = resolveHelpDisplayGroup(article.id, article.group);
        return helpCenterCopy.groups[displayGroup] ?? displayGroup;
      })()
    : "";

  const crumbs = resolveDetailCrumbs({
    from: incoming?.from,
    fromLabel: incoming?.fromLabel,
    module: { listPath: AYUDA_LIST_PATH, label: AYUDA_MODULE_LABEL },
    current: { label: article?.title ?? copy.backLabel },
  });

  const mailtoHref = buildSupportMailto({
    supportEmail: config.support.email,
    productName: config.app.name || BRAND.productName,
    tenantName: user?.tenant?.name,
    userEmail: user?.email,
    currentPath: `${location.pathname}${location.search}`,
    environment: config.observability.environment,
    release: config.observability.release,
  });

  if (!isLoading && isLoadError) {
    return (
      <DetailPageShell
        isLoading={false}
        header={{
          crumbs,
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
        icon: <BookOpen className="h-10 w-10" />,
        title: copy.notFoundTitle,
        description: copy.notFoundDescription,
        backHref: "/ayuda",
        backLabel: copy.notFoundAction,
      }}
      header={{
        crumbs,
        title: article?.title ?? "",
        subtitle: groupLabel || undefined,
      }}
    >
      {article && (
        <div
          className="mx-auto flex w-full max-w-[720px] flex-col gap-6"
          data-help-article-layout="a"
        >
          {/* Orden V3: Frase → Para quién → Pasos → Si falla → Soporte → Qué no cubre → ¿Te sirvió? */}
          <p className="m-0 text-[15px] leading-6 text-foreground" data-help-phrase="">
            {article.phrase}
          </p>

          <HelpRoleChips roles={article.roles} currentRole={user?.role} />

          {article.guide?.trim() ? <HelpSteps guide={article.guide} /> : null}

          {article.problem?.trim() ? (
            <HelpProblemList problem={article.problem} />
          ) : null}

          <div
            className="flex flex-wrap items-center gap-3 rounded-lg bg-muted px-3.5 py-3 text-sm"
            data-help-support=""
          >
            <span className="min-w-0 flex-1 text-muted-foreground">
              {copy.supportPrompt}
            </span>
            <Button variant="outline" size="sm" asChild>
              <a href={mailtoHref}>{copy.writeSupport}</a>
            </Button>
          </div>

          {article.notCovered?.trim() ? (
            <section className="flex flex-col gap-2" data-help-not-covered="">
              <h2 className="text-base font-semibold leading-6">
                {copy.notCoveredSection}
              </h2>
              <Card className="px-4 py-1.5">
                <HelpRichText markdown={article.notCovered} />
              </Card>
            </section>
          ) : null}

          <div data-help-feedback="">
            <ArticleFeedback
              key={article.id}
              articleId={article.id}
              onRequestTicket={
                ticketsEnabled ? () => setTicketSheetOpen(true) : undefined
              }
            />
          </div>
        </div>
      )}

      {ticketsEnabled ? (
        <CreateTicketSheet
          open={ticketSheetOpen}
          onOpenChange={setTicketSheetOpen}
          articleId={article?.id}
          articleTitle={article?.title}
          route={location.pathname}
          tenantName={user?.tenant?.name}
        />
      ) : null}
    </DetailPageShell>
  );
}

export default HelpArticlePage;
