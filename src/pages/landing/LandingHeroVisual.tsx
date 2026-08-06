/**
 * Ancla visual del hero `/welcome`: tracto line-art (PNG) + motivo ruta + plinto.
 * Decorative; reduced-motion en landing.css.
 */
import { cn } from "@shared/lib/utils/cn";

const ROUTE_SRC = "/brand/tlama-landing-motif-route.svg";
const HERO_VISUAL_SRC = "/brand/tlama-landing-hero-visual-tractor.png";

type LandingHeroVisualProps = {
  className?: string;
};

export function LandingHeroVisual({ className }: LandingHeroVisualProps) {
  return (
    <div
      className={cn("landing-hero-visual relative w-full", className)}
      aria-hidden
    >
      <div className="landing-hero-stage relative mx-auto flex w-full max-w-xl items-end justify-center lg:max-w-none">
        <img
          src={ROUTE_SRC}
          alt=""
          width={280}
          height={160}
          decoding="async"
          className="landing-hero-route pointer-events-none absolute top-[6%] left-[4%] z-0 w-[58%] max-w-[280px] sm:top-[2%] sm:left-[2%]"
        />

        <div className="landing-hero-plinth pointer-events-none absolute bottom-[6%] left-1/2 z-0 h-[18%] w-[78%] -translate-x-1/2 rounded-[100%]" />

        <img
          src={HERO_VISUAL_SRC}
          alt=""
          width={2759}
          height={1477}
          decoding="async"
          fetchPriority="high"
          className="landing-hero-truck-art pointer-events-none relative z-[1] h-auto w-full max-w-[520px] select-none object-contain sm:max-w-[600px] lg:max-w-[min(100%,640px)] xl:max-w-[min(100%,700px)]"
        />
      </div>
    </div>
  );
}
