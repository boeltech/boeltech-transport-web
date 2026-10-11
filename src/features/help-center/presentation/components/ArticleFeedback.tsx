import { memo, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { trackHelpEvent } from "../../application/trackHelpEvent";
import {
  hasHelpFeedback,
  markHelpFeedback,
} from "../../infrastructure/helpSessionFlags";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.feedback;

type FeedbackPhase = "ask" | "thanks" | "not_helpful";

interface ArticleFeedbackProps {
  articleId: string;
  /** Si el artículo tiene `problem`, tras No se ofrece acceso. */
  hasProblem?: boolean;
  /** Densidad del panel (~448px). */
  compact?: boolean;
  /** Ausente = tickets pausados (no mostrar CTA de ticket). */
  onRequestTicket?: () => void;
  onShowProblem?: () => void;
}

function initialPhase(articleId: string): FeedbackPhase {
  return hasHelpFeedback(articleId) ? "thanks" : "ask";
}

export const ArticleFeedback = memo(function ArticleFeedback({
  articleId,
  hasProblem = false,
  compact = false,
  onRequestTicket,
  onShowProblem,
}: ArticleFeedbackProps) {
  const location = useLocation();
  const [phase, setPhase] = useState<FeedbackPhase>(() =>
    initialPhase(articleId),
  );

  const emitFeedback = useCallback(
    (helpful: boolean) => {
      trackHelpEvent({
        eventName: "help_article_feedback",
        articleId,
        route: location.pathname,
        payload: { helpful },
      });
    },
    [articleId, location.pathname],
  );

  const handleYes = useCallback(() => {
    emitFeedback(true);
    markHelpFeedback(articleId);
    setPhase("thanks");
  }, [articleId, emitFeedback]);

  const handleNo = useCallback(() => {
    emitFeedback(false);
    setPhase("not_helpful");
    onShowProblem?.();
  }, [emitFeedback, onShowProblem]);

  if (phase === "thanks") {
    return (
      <p
        className={
          compact
            ? "text-xs text-muted-foreground"
            : "text-sm text-muted-foreground"
        }
        role="status"
      >
        {copy.thanks}
      </p>
    );
  }

  if (phase === "not_helpful") {
    const showTicket = Boolean(onRequestTicket);
    const showProblem = Boolean(hasProblem && onShowProblem);
    if (!showTicket && !showProblem) {
      return null;
    }
    return (
      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        {showTicket ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={compact ? "h-7 text-xs" : undefined}
            onClick={onRequestTicket}
          >
            {copy.sendTicketAboutThis}
          </Button>
        ) : null}
        {showProblem ? (
          <button
            type="button"
            className="block text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={onShowProblem}
          >
            {copy.problemLink}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "space-y-1.5 border-t border-border/60 pt-2"
          : "space-y-2 border-t pt-4"
      }
    >
      <p
        className={
          compact
            ? "text-xs font-medium text-foreground"
            : "text-sm font-medium text-foreground"
        }
      >
        {copy.question}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={compact ? "h-7 px-2.5 text-xs" : undefined}
          onClick={handleYes}
        >
          {copy.yes}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={compact ? "h-7 px-2.5 text-xs" : undefined}
          onClick={handleNo}
        >
          {copy.no}
        </Button>
      </div>
    </div>
  );
});
