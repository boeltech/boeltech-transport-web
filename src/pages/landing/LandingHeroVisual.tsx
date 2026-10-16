/**
 * Capa visual full-bleed del hero `/welcome`.
 * A1: foto patio/flota (`tlama-landing-hero-yard.png`) + overlay ruta sutil.
 * Hero híbrido: patio de fondo; copy+preview centrados encima (LandingPage).
 * Decorative; reduced-motion en landing.css.
 */
import { cn } from "@shared/lib/utils/cn";

const ROUTE_SRC = "/brand/tlama-landing-motif-route.svg";
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

      <div className="landing-hero-stage">
        <img
          src={ROUTE_SRC}
          alt=""
          width={280}
          height={160}
          decoding="async"
          loading="lazy"
          className="landing-hero-route"
        />
      </div>
    </div>
  );
}
