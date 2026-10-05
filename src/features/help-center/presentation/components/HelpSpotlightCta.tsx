import { memo, useCallback, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import config from "@shared/config/env";
import { Button } from "@shared/ui/button";
import { trackHelpEvent } from "../../application/trackHelpEvent";
import {
  getPrimaryHelpSpotlightTarget,
  matchHelpScreen,
  type HelpSpotlightTarget,
} from "../../domain";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { findHelpAnchorElement } from "../utils/findHelpAnchorElement";
import {
  setHelpSpotlightChrome,
  waitForSpotlightChrome,
} from "../utils/helpSpotlightChrome";
import { HelpSpotlightOverlay } from "./HelpSpotlightOverlay";

const copy = helpCenterCopy.spotlight;

type SpotlightPhase = "idle" | "active" | "unavailable";

interface HelpSpotlightCtaProps {
  articleId: string;
  articleScreens: readonly string[];
  pathname: string;
  onRequestTicket?: () => void;
  onShowProblem?: () => void;
  hasProblem?: boolean;
}

function resolveScreens(
  target: HelpSpotlightTarget,
  articleScreens: readonly string[],
): readonly string[] {
  return target.screens?.length ? target.screens : articleScreens;
}

/**
 * CTA «Muéstrame dónde» — solo si hay target en registry y la ruta ∈ screens.
 * Nunca auto-start (PRD D-A1.1). Aparta el Sheet antes de resaltar (D-A1.4).
 */
export const HelpSpotlightCta = memo(function HelpSpotlightCta({
  articleId,
  articleScreens,
  pathname,
  onRequestTicket,
  onShowProblem,
  hasProblem = false,
}: HelpSpotlightCtaProps) {
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<SpotlightPhase>("idle");
  const [activeEl, setActiveEl] = useState<HTMLElement | null>(null);

  const target = useMemo(
    () => getPrimaryHelpSpotlightTarget(articleId),
    [articleId],
  );

  const isEligible = useMemo(() => {
    if (!config.help.spotlightEnabled || !target) return false;
    const screens = resolveScreens(target, articleScreens);
    return matchHelpScreen(pathname, screens);
  }, [articleScreens, pathname, target]);

  const handleActivate = useCallback(async () => {
    if (!target) return;

    // Tuck Sheet + backdrop so the hole doesn't reveal the panel (bug QA).
    setHelpSpotlightChrome(true);
    await waitForSpotlightChrome();

    const found = findHelpAnchorElement(target.anchorId);
    if (!found.ok) {
      setHelpSpotlightChrome(false);
      trackHelpEvent({
        eventName: "help_spotlight_unavailable",
        articleId,
        route: pathname,
        payload: { anchorId: target.anchorId, reason: found.reason },
      });
      setPhase("unavailable");
      setActiveEl(null);
      return;
    }

    try {
      found.element.scrollIntoView({ block: "center", behavior: "smooth" });
    } catch {
      found.element.scrollIntoView({ block: "center" });
    }

    await waitForSpotlightChrome();

    const after = findHelpAnchorElement(target.anchorId);
    if (!after.ok) {
      setHelpSpotlightChrome(false);
      trackHelpEvent({
        eventName: "help_spotlight_unavailable",
        articleId,
        route: pathname,
        payload: { anchorId: target.anchorId, reason: after.reason },
      });
      setPhase("unavailable");
      setActiveEl(null);
      return;
    }

    trackHelpEvent({
      eventName: "help_spotlight_shown",
      articleId,
      route: pathname,
      payload: { anchorId: target.anchorId },
    });
    setActiveEl(after.element);
    setPhase("active");
  }, [articleId, pathname, target]);

  const handleClose = useCallback(() => {
    setHelpSpotlightChrome(false);
    setPhase("idle");
    setActiveEl(null);
  }, []);

  if (!isEligible || !target) {
    return null;
  }

  return (
    <div className="space-y-2">
      {phase !== "unavailable" ? (
        <Button
          ref={ctaRef}
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            void handleActivate();
          }}
          data-testid="help-spotlight-cta"
        >
          <MapPin className="mr-2 h-3.5 w-3.5" />
          {copy.cta}
        </Button>
      ) : null}

      {phase === "unavailable" ? (
        <div
          className="space-y-2 rounded-md bg-muted/50 p-3"
          role="status"
          data-testid="help-spotlight-unavailable"
        >
          <p className="text-xs text-muted-foreground">{copy.unavailable}</p>
          <div className="flex flex-wrap gap-2">
            {onRequestTicket ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRequestTicket}
              >
                {copy.sendTicket}
              </Button>
            ) : null}
            {hasProblem && onShowProblem ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onShowProblem}
              >
                {copy.showProblem}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPhase("idle")}
            >
              {copy.done}
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "active" && activeEl ? (
        <HelpSpotlightOverlay
          target={activeEl}
          onClose={handleClose}
          returnFocusRef={ctaRef}
        />
      ) : null}
    </div>
  );
});
