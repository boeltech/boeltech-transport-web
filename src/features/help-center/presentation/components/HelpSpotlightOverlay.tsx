import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@shared/ui/button";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { setHelpSpotlightChrome } from "../utils/helpSpotlightChrome";

const copy = helpCenterCopy.spotlight;

const PADDING = 6;

type Rect = { top: number; left: number; width: number; height: number };

interface HelpSpotlightOverlayProps {
  target: HTMLElement;
  onClose: () => void;
  /** Element that should receive focus when the spotlight closes. */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

function readRect(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

/**
 * Underlay + ring around the target. Does not change the route (PRD D-A1.4).
 * Sheet chrome is tucked by `setHelpSpotlightChrome` before mount.
 * Close: Esc, click outside highlight, or «Listo».
 */
export function HelpSpotlightOverlay({
  target,
  onClose,
  returnFocusRef,
}: HelpSpotlightOverlayProps) {
  const [rect, setRect] = useState<Rect>(() => readRect(target));

  useLayoutEffect(() => {
    setRect(readRect(target));
  }, [target]);

  useEffect(() => {
    const update = () => setRect(readRect(target));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useEffect(() => {
    // Keep chrome tucked for the whole overlay lifetime; clear on unmount.
    setHelpSpotlightChrome(true);
    return () => {
      setHelpSpotlightChrome(false);
      returnFocusRef?.current?.focus?.();
    };
  }, [returnFocusRef]);

  const hole = {
    top: Math.max(0, rect.top),
    left: Math.max(0, rect.left),
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="false"
      aria-label={copy.cta}
      data-testid="help-spotlight-overlay"
    >
      {/* Dim layer with click-outside close; pointer-events only on the dim. */}
      <button
        type="button"
        className="absolute inset-0 cursor-default border-0 bg-transparent p-0"
        aria-label={copy.done}
        onClick={onClose}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-foreground/40"
        style={{
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
            ${hole.left}px ${hole.top}px,
            ${hole.left}px ${hole.top + hole.height}px,
            ${hole.left + hole.width}px ${hole.top + hole.height}px,
            ${hole.left + hole.width}px ${hole.top}px,
            ${hole.left}px ${hole.top}px
          )`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute rounded-md ring-2 ring-primary ring-offset-2 ring-offset-background"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-auto absolute z-[81] flex justify-center"
        style={{
          top: Math.min(
            hole.top + hole.height + 12,
            window.innerHeight - 56,
          ),
          left: hole.left,
          width: Math.max(hole.width, 120),
        }}
      >
        <Button
          type="button"
          size="sm"
          onClick={onClose}
          data-testid="help-spotlight-done"
        >
          {copy.done}
        </Button>
      </div>
    </div>,
    document.body,
  );
}
