import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { BookOpen, ChevronDown } from "lucide-react";
import config from "@shared/config/env";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailPageShell } from "@shared/ui/page-shells";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { useAuth } from "@/shared/hooks/useAuth";
import { useHelpArticle } from "../../application";
import { trackHelpEvent } from "../../application/trackHelpEvent";
import { markHelpArticleViewed } from "../../infrastructure/helpSessionFlags";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { renderSimpleMarkdown } from "../utils/renderSimpleMarkdown";
import { ArticleFeedback } from "../components/ArticleFeedback";
import { CreateTicketSheet } from "../components/CreateTicketSheet";

const copy = helpCenterCopy.detail;

export function HelpArticlePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const ticketsEnabled = config.help.ticketsEnabled;
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const {
    data: article,
    isLoading,
    isError,
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

  const notFound = !isLoading && (isError || !article);
  const groupLabel = article
    ? (helpCenterCopy.groups[article.group] ?? article.group)
    : "";

  return (
    <DetailPageShell
      isLoading={isLoading}
      notFound={notFound}
      notFoundConfig={{
        icon: <BookOpen className="h-10 w-10" />,
        title: copy.notFoundTitle,
        description: copy.notFoundDescription,
        backHref: "/ayuda",
        backLabel: copy.notFoundAction,
      }}
      header={{
        backHref: "/ayuda",
        backLabel: copy.backLabel,
        icon: <BookOpen className="h-6 w-6" />,
        title: article?.title ?? "",
        subtitle: article?.phrase,
      }}
    >
      {article && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2" aria-label={copy.groupLabel}>
            <Badge variant="neutral" tone="soft">
              {groupLabel}
            </Badge>
          </div>

          {article.guide && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{copy.stepsSection}</h2>
              <div
                className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: renderSimpleMarkdown(article.guide),
                }}
              />
            </section>
          )}

          <ArticleFeedback
            key={article.id}
            articleId={article.id}
            hasProblem={Boolean(article.problem)}
            onRequestTicket={
              ticketsEnabled ? () => setTicketSheetOpen(true) : undefined
            }
            onShowProblem={
              article.problem ? () => setShowProblem(true) : undefined
            }
          />

          {article.problem && (
            <Collapsible open={showProblem} onOpenChange={setShowProblem}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-0 text-base font-semibold hover:bg-transparent"
                >
                  {copy.problemSection}
                  <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div
                  className="prose prose-sm dark:prose-invert mt-2 max-w-none rounded-lg bg-muted/50 p-4 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderSimpleMarkdown(article.problem),
                  }}
                />
              </CollapsibleContent>
            </Collapsible>
          )}

          {ticketsEnabled ? (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setTicketSheetOpen(true)}
              >
                {copy.sendTicketAboutThis}
              </Button>
            </div>
          ) : null}
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
