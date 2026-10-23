/**
 * Capa visual full-bleed del hero `/welcome`.
 * A1: foto patio/flota (`tlama-landing-hero-yard.png`).
 * Decorative; reduced-motion en landing.css.
 */
import { cn } from "@shared/lib/utils/cn";

/** A1 — flota en patio, copy space a la izquierda (Unsplash / Getty partner). */
const HERO_PHOTO_SRC = "/brand/tlama-landing-hero-yard.png";

type LandingHeroVisualProps = {
  className?: string;
};

export function LandingHeroVisual({ className }: LandingHeroVisualProps) {
  return (
    <div className={cn("landing-hero-visual", className)} aria-hidden>
      <img
        src={HERO_PHOTO_SRC}
        alt=""
        width={2400}
        height={1350}
        decoding="async"
        fetchPriority="high"
        className="landing-hero-photo"
      />
    </div>
  );
}
