import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { trackHelpEvent } from "../../application/trackHelpEvent";
import type { HelpArticle } from "../../domain";
import { markHelpArticleViewed } from "../../infrastructure/helpSessionFlags";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { renderSimpleMarkdown } from "../utils/renderSimpleMarkdown";
import { truncateGuideForPanel } from "../utils/truncateGuideForPanel";
import { ArticleFeedback } from "./ArticleFeedback";
import { HelpSpotlightCta } from "./HelpSpotlightCta";

const copy = helpCenterCopy.panel;

interface ArticleCardProps {
  article: HelpArticle;
  /** Called when user navigates to the full article page (to close parent sheet). */
  onNavigate?: () => void;
  /** Open ticket sheet with this article (parent owns CreateTicketSheet). */
  onOpenTicket?: (article: HelpArticle) => void;
  /** Open expanded (deep-link from empty / ⌘K). */
  defaultExpanded?: boolean;
}

export const ArticleCard = memo(function ArticleCard({
  article,
  onNavigate,
  onOpenTicket,
  defaultExpanded = false,
}: ArticleCardProps) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showProblem, setShowProblem] = useState(false);
  const trackedDefaultExpand = useRef(false);

  const guidePreview = useMemo(() => {
    if (!article.guide) return { preview: "", truncated: false };
    return truncateGuideForPanel(article.guide);
  }, [article.guide]);

  const trackViewed = useCallback(() => {
    markHelpArticleViewed(article.id);
    trackHelpEvent({
      eventName: "help_article_viewed",
      articleId: article.id,
      route: location.pathname,
      payload: { surface: "panel" },
    });
  }, [article.id, location.pathname]);

  useEffect(() => {
    if (!defaultExpanded || trackedDefaultExpand.current) return;
    trackedDefaultExpand.current = true;
    setExpanded(true);
    trackViewed();
  }, [defaultExpanded, trackViewed]);

  const handleToggleExpand = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (next) {
        trackViewed();
      } else {
        setShowProblem(false);
      }
      return next;
    });
  }, [trackViewed]);

  const handleShowProblem = useCallback(() => {
    setShowProblem(true);
  }, []);

  const handleRequestTicket = useCallback(() => {
    onOpenTicket?.(article);
  }, [article, onOpenTicket]);

  return (
    <div className="rounded-lg border bg-card p-3">
      <button
        type="button"
        className="flex w-full items-start gap-2 text-left"
        onClick={handleToggleExpand}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">{article.title}</p>
          {!expanded && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {article.phrase}
            </p>
          )}
        </div>
        <ChevronRight
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {guidePreview.preview && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: renderSimpleMarkdown(guidePreview.preview),
              }}
            />
          )}

          {guidePreview.truncated && (
            <p className="text-xs text-muted-foreground">{copy.moreSteps}</p>
          )}

          <HelpSpotlightCta
            articleId={article.id}
            articleScreens={article.screens}
            pathname={location.pathname}
            onRequestTicket={handleRequestTicket}
            onShowProblem={
              article.problem && !guidePreview.truncated
                ? handleShowProblem
                : undefined
            }
            hasProblem={Boolean(article.problem) && !guidePreview.truncated}
          />

          <ArticleFeedback
            key={article.id}
            articleId={article.id}
            hasProblem={Boolean(article.problem) && !guidePreview.truncated}
            compact
            onRequestTicket={handleRequestTicket}
            onShowProblem={
              article.problem && !guidePreview.truncated
                ? handleShowProblem
                : undefined
            }
          />

          {article.problem && !guidePreview.truncated && (
            <Collapsible open={showProblem} onOpenChange={setShowProblem}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {copy.didntSolve}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div
                  className="prose prose-sm dark:prose-invert mt-2 max-w-none rounded-md bg-muted/50 p-3 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderSimpleMarkdown(article.problem),
                  }}
                />
              </CollapsibleContent>
            </Collapsible>
          )}

          <Link
            to={`/ayuda/${article.id}`}
            onClick={onNavigate}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {copy.viewFullArticle}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
});
