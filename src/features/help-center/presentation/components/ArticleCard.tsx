import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { useAuth } from "@/shared/hooks/useAuth";
import { trackHelpEvent } from "../../application/trackHelpEvent";
import type { HelpArticle } from "../../domain";
import { markHelpArticleViewed } from "../../infrastructure/helpSessionFlags";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { truncateGuideForPanel } from "../utils/truncateGuideForPanel";
import { ArticleFeedback } from "./ArticleFeedback";
import { HelpProblemList } from "./HelpProblemList";
import { HelpRichText } from "./HelpRichText";
import { HelpRoleChips } from "./HelpRoleChips";
import { HelpSpotlightCta } from "./HelpSpotlightCta";
import { HelpSteps } from "./HelpSteps";

const copy = helpCenterCopy.panel;
const detailCopy = helpCenterCopy.detail;

interface ArticleCardProps {
  article: HelpArticle;
  /** Controlled accordion (P-V3 — una abierta a la vez desde HelpPanel). */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Called when user navigates to the full article page (to close parent sheet). */
  onNavigate?: () => void;
  /** Open ticket sheet with this article (parent owns CreateTicketSheet). */
  onOpenTicket?: (article: HelpArticle) => void;
}

export const ArticleCard = memo(function ArticleCard({
  article,
  expanded,
  onExpandedChange,
  onNavigate,
  onOpenTicket,
}: ArticleCardProps) {
  const location = useLocation();
  const { user } = useAuth();
  const trackedExpand = useRef(false);

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
    if (!expanded || trackedExpand.current) return;
    trackedExpand.current = true;
    trackViewed();
  }, [expanded, trackViewed]);

  const handleToggleExpand = useCallback(() => {
    const next = !expanded;
    if (next) {
      trackViewed();
      trackedExpand.current = true;
    }
    onExpandedChange(next);
  }, [expanded, onExpandedChange, trackViewed]);

  const handleRequestTicket = useCallback(() => {
    onOpenTicket?.(article);
  }, [article, onOpenTicket]);

  return (
    <div
      className="rounded-lg border bg-card p-3"
      data-help-article-card=""
      data-expanded={expanded ? "true" : undefined}
    >
      <button
        type="button"
        className="flex w-full items-start gap-2 text-left"
        onClick={handleToggleExpand}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">{article.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {article.phrase}
          </p>
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
          {/* Orden V3: Para quién → Pasos → Si falla → Qué no cubre → feedback → link */}
          <HelpRoleChips
            roles={article.roles}
            currentRole={user?.role}
            className="text-xs"
          />

          {guidePreview.preview ? (
            <HelpSteps guide={guidePreview.preview} variant="tight" />
          ) : null}

          {guidePreview.truncated ? (
            <p className="text-xs text-muted-foreground">{copy.moreSteps}</p>
          ) : null}

          {article.problem?.trim() ? (
            <HelpProblemList problem={article.problem} variant="tight" />
          ) : null}

          {article.notCovered?.trim() ? (
            <div data-help-not-covered="">
              <p className="mb-1 text-xs font-semibold text-foreground">
                {detailCopy.notCoveredSection}
              </p>
              <HelpRichText
                markdown={article.notCovered}
                className="text-sm"
              />
            </div>
          ) : null}

          <HelpSpotlightCta
            articleId={article.id}
            articleScreens={article.screens}
            pathname={location.pathname}
            onRequestTicket={onOpenTicket ? handleRequestTicket : undefined}
          />

          <ArticleFeedback
            key={article.id}
            articleId={article.id}
            compact
            onRequestTicket={onOpenTicket ? handleRequestTicket : undefined}
          />

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
