/**
 * Reveal al entrar en viewport (IntersectionObserver, once).
 * `eager`: visible de inmediato (above-fold) sin opacity:0 ni IO.
 */
import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@shared/lib/utils/cn";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  /** Retraso en ms aplicado cuando la animación corre */
  delayMs?: number;
  style?: CSSProperties;
  /**
   * Above-fold: monta ya visible (sin gate de opacity).
   * No usa IntersectionObserver.
   */
  eager?: boolean;
};

export function LandingReveal({
  children,
  className,
  delayMs = 0,
  style,
  eager = false,
}: LandingRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (eager) return;

    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.add("is-visible");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <div
      ref={ref}
      className={cn(
        "landing-reveal",
        eager && "is-visible is-eager",
        className,
      )}
      style={{
        ...style,
        ...(delayMs > 0
          ? ({ ["--landing-delay" as string]: `${delayMs}ms` } as CSSProperties)
          : undefined),
      }}
    >
      {children}
    </div>
  );
}
