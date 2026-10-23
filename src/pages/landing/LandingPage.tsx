import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Menu, UserPlus, X } from "lucide-react";
import { Button } from "@shared/ui/button";
import { BrandLockup, Wordmark } from "@shared/ui/brand";
import { cn } from "@shared/lib/utils/cn";
import { landingCopy } from "./landingCopy";
import { usePublicOperationalPlans } from "@shared/commercial/usePublicOperationalPlans";
import { usePublicSelfServeRegister } from "@shared/commercial/usePublicSelfServeRegister";
import { LandingReveal } from "./LandingReveal";
import { LandingHeroVisual } from "./LandingHeroVisual";
import { LandingProductPreview } from "./LandingProductPreview";
import { LandingFleetSizeSelector } from "./LandingFleetSizeSelector";
import { LandingFaq } from "./LandingFaq";
import { prefetchCommercialAsset } from "./landingPrefetch";
import "./landing.css";

function planCodeForFleetOption(optionId: string): string {
  const match = landingCopy.pricing.fleetSelector.options.find(
    (o) => o.id === optionId,
  );
  return match?.planCode ?? landingCopy.pricing.popularCode;
}

/** SoT usa «unidades»; en landing pricing mostramos «motrices» (mismo rango). */
function fleetUnitsLabelForLanding(unitsLabel: string): string {
  return unitsLabel.replace(/\bunidades\b/gi, "motrices");
}

/**
 * Landing pública (`/welcome`): embudo D1–D12 · look «Señal de patio».
 * Secuencia: Hero(+chrome+trust) → Evidencia → Precios → Opcionales → FAQ → CTA → Footer.
 * Máx. 2 LandingReveal en hero/cierre: hero copy (eager), CTA cierre.
 * Hero: patio full-bleed + scrim + copy/CTA + trust tipográfico (~1 viewport; UI en #evidencia).
 * F1: chrome on-dark dentro del hero. F2: sticky elevated + lockup al salir del hero.
 */
const LandingPage = () => {
  return (
    <div className="landing-root relative min-h-screen overflow-x-hidden">
      <a href="#contenido" className="landing-skip sr-only focus:not-sr-only">
        {landingCopy.skipLink}
      </a>

      <main id="contenido">
        <HeroSection />
        <EvidenceSection />
        <PricingSection />
        <OptionalsSection />
        <LandingFaq />
        <CTASection />
      </main>
      <Footer />
      <StickyMobileCta />
    </div>
  );
};

/**
 * A/B lockup en chrome del hero (solo no-stuck; stuck sigue brand).
 * - mixed: mark teal + wordmark on-ink (A)
 * - knockout: mark + wordmark blancos vía --landing-on-dark (B · prueba)
 * Volver a A: cambiar a `"mixed"`.
 */
export const LANDING_HERO_LOCKUP_AB: "mixed" | "knockout" = "knockout";

/**
 * Chrome único (F1+F2): on-dark en hero; `is-stuck` elevated al cruzar el umbral
 * del hero (IntersectionObserver sobre `[data-landing-hero]`).
 * F1 navs: menú secciones &lt;md (Cómo funciona / Precios); CTA siempre en barra.
 */
const HeroChrome = () => {
  const { brand, nav } = landingCopy;
  const { open: registrationOpen } = usePublicSelfServeRegister();
  const [stuck, setStuck] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavId = useId();

  const heroLockup =
    LANDING_HERO_LOCKUP_AB === "knockout"
      ? ({
          data: "hero-knockout",
          variant: "current",
          markVariant: "current",
        } as const)
      : ({
          data: "hero-mixed",
          variant: "onInk",
          markVariant: "brand",
        } as const);

  useEffect(() => {
    const heroEl = document.querySelector("[data-landing-hero]");
    if (!heroEl || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStuck(entry ? !entry.isIntersecting : false);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  /* Cerrar menú móvil al pasar a md+ */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const navLinks = [
    { href: `#${landingCopy.evidence.id}`, label: nav.product },
    { href: `#${landingCopy.pricing.id}`, label: nav.pricing },
  ];

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <header
      className={cn("landing-hero-chrome", stuck && "is-stuck")}
      data-landing-hero-chrome
      data-stuck={stuck ? "true" : "false"}
    >
      <div className="landing-shell flex h-16 items-center justify-between gap-3">
        <Link
          to="/welcome"
          className="flex shrink-0 items-center gap-2"
          aria-label={brand}
          data-landing-lockup={stuck ? "brand" : heroLockup.data}
          onClick={closeMobileNav}
        >
          <BrandLockup
            /* stuck = brand. Hero: A mixed (onInk) · B knockout (current → on-dark). */
            variant={stuck ? "brand" : heroLockup.variant}
            markVariant={stuck ? "brand" : heroLockup.markVariant}
            decorative
            markSize={32}
            wordmarkClassName="text-xl sm:text-2xl"
          />
        </Link>

        <nav
          className="landing-hero-chrome-nav hidden items-center gap-6 md:flex"
          aria-label={nav.sectionsLabel}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "landing-mobile-nav-trigger md:hidden",
              stuck ? "landing-btn-ghost-ink" : "landing-btn-ghost-on-dark",
            )}
            aria-expanded={mobileNavOpen}
            aria-controls={mobileNavId}
            aria-label={mobileNavOpen ? nav.menuClose : nav.menuOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={
              stuck ? "landing-btn-ghost-ink" : "landing-btn-ghost-on-dark"
            }
          >
            <Link to="/login">{nav.login}</Link>
          </Button>
          {registrationOpen ? (
            <Button asChild size="sm" className="landing-cta-amber">
              <Link to="/register">
                <UserPlus className="mr-2 hidden h-4 w-4 sm:inline" />
                {nav.register}
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              variant="outline"
              className={
                stuck
                  ? "landing-btn-outline-ink"
                  : "landing-btn-outline-on-dark"
              }
            >
              <a href="mailto:ventas@boeltech.com">{nav.contactSales}</a>
            </Button>
          )}
        </div>
      </div>

      {mobileNavOpen ? (
        <nav
          id={mobileNavId}
          className="landing-mobile-nav md:hidden"
          aria-label={nav.sectionsLabel}
          data-landing-mobile-nav
        >
          <div className="landing-shell flex flex-col gap-1 py-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="landing-mobile-nav-link"
                onClick={closeMobileNav}
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
};

const HeroSection = () => {
  const { hero } = landingCopy;
  const { open: registrationOpen } = usePublicSelfServeRegister();

  return (
    <section className="landing-hero is-visual-ready relative" data-landing-hero>
      <LandingHeroVisual />
      <div className="landing-hero-scrim" aria-hidden />

      <HeroChrome />

      <div className="landing-shell landing-hero-content">
        {/* Patio + copy/CTA; prueba de UI solo en #evidencia (sin preview en hero). */}
        <div className="landing-hero-stack relative z-10">
          <div className="landing-hero-copy mx-auto w-full max-w-2xl text-center">
            <LandingReveal eager>
              <h1 className="landing-hero-enter-item landing-display text-[color:var(--landing-on-dark)]">
                {hero.title}
              </h1>
              <p className="landing-hero-enter-item landing-hero-support mx-auto">
                {hero.subtitle}
              </p>

              <div className="landing-hero-enter-item landing-hero-cta-wrap flex flex-col items-center justify-center">
                {/*
                  Primario del hero = Contactar ventas (D2 CEO).
                  No bifurcar a Probar gratis aquí mientras self-serve esté off;
                  login vive en chrome (`nav.login`), no junto al CTA del hero.
                */}
                <Button
                  size="lg"
                  asChild
                  className="landing-hero-cta landing-cta-amber min-w-[210px]"
                >
                  <a href="mailto:ventas@boeltech.com">
                    {hero.ctaPrimaryClosed}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
              <p className="landing-hero-enter-item landing-hero-hint flex items-center justify-center gap-2 text-sm text-[color:var(--landing-on-dark)]/70">
                {registrationOpen ? (
                  <>
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--landing-amber)]"
                      aria-hidden
                    />
                    {hero.trialHint}
                  </>
                ) : (
                  hero.badgeClosed
                )}
              </p>
            </LandingReveal>
          </div>
        </div>
      </div>

      <div className="landing-hero-trust landing-shell">
        <TrustStrip />
      </div>
    </section>
  );
};

/** Trust fiscal tipográfico (D4); pie del hero full-bleed. Labels SAT intactos. */
const TrustStrip = () => {
  const { trust } = landingCopy;
  return (
    <p
      className="landing-hero-trust-text mx-auto max-w-3xl text-center text-sm tracking-wide"
      aria-label={trust.ariaLabel}
    >
      {trust.items.map((item, i) => (
        <span key={item.label}>
          {i > 0 ? (
            <span className="landing-hero-trust-sep mx-2.5" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="landing-hero-trust-label">{item.label}</span>
          <span className="landing-hero-trust-hint"> {item.hint}</span>
        </span>
      ))}
    </p>
  );
};

/** Intervalo autoplay carrusel evidencia (ms). */
const EVIDENCE_AUTOPLAY_MS = 5500;
/** Tras elegir un tab a mano, reinicia el reloj (ms). */
const EVIDENCE_AUTOPLAY_RESUME_MS = 8000;
/** Fade+slide del copy al cambiar beat (alineado a crossfade crop). */
const EVIDENCE_COPY_FADE_MS = 280;

/** F3: tabs + crops A3 por beat (fallback mock si asset disabled). F1: fade copy + crossfade crop. F2: prefetch crops. */
const EvidenceSection = () => {
  const { evidence, product } = landingCopy;
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [copyFading, setCopyFading] = useState(false);
  const [sectionInView, setSectionInView] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndexRef = useRef(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const resumeAtRef = useRef(0);
  const active = product.items[displayedIndex] ?? product.items[0]!;
  const tablistId = "landing-evidence-tabs";
  const beatCount = product.items.length;

  activeIndexRef.current = activeIndex;

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  /* F2 D2: al montar, prefetch del siguiente beat (index+1). */
  useEffect(() => {
    const nextBeat = product.items[1];
    if (nextBeat) prefetchCommercialAsset(nextBeat.previewAssetId);
  }, [product.items]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setSectionInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const selectBeat = useCallback((next: number) => {
    if (next === activeIndexRef.current) return;
    setActiveIndex(next);

    /* Siempre fade+slide del copy (carrusel); el crop usa carouselMotion. */
    setCopyFading(true);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      setDisplayedIndex(next);
      setCopyFading(false);
      fadeTimerRef.current = null;
    }, EVIDENCE_COPY_FADE_MS);
  }, []);

  const selectBeatManual = useCallback(
    (next: number) => {
      resumeAtRef.current = Date.now() + EVIDENCE_AUTOPLAY_RESUME_MS;
      selectBeat(next);
    },
    [selectBeat],
  );

  /*
   * Carrusel: avanza en vista; fade+slide en copy/crop (carouselMotion).
   * No pausa en hover. Tras click manual espera EVIDENCE_AUTOPLAY_RESUME_MS.
   */
  useEffect(() => {
    if (!sectionInView || beatCount < 2) return;

    const id = window.setInterval(() => {
      if (Date.now() < resumeAtRef.current) return;
      const next = (activeIndexRef.current + 1) % beatCount;
      prefetchCommercialAsset(product.items[next]!.previewAssetId);
      selectBeat(next);
    }, EVIDENCE_AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [sectionInView, beatCount, product.items, selectBeat]);

  const prefetchBeat = (index: number) => {
    const beat = product.items[index];
    if (beat) prefetchCommercialAsset(beat.previewAssetId);
  };

  return (
    <section
      ref={sectionRef}
      id={evidence.id}
      className="landing-band landing-band-surface landing-evidence scroll-mt-20 py-16 md:py-20"
      data-landing-evidence-autoplay={sectionInView ? "on" : "offscreen"}
    >
      <div className="landing-shell">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="landing-section-title">{evidence.title}</h2>
          <p className="landing-muted-text mt-4">{evidence.subtitle}</p>
        </div>

        <div className="landing-evidence-layout mt-10 md:mt-12">
          <div
            className="landing-evidence-tabs"
            role="tablist"
            aria-label={evidence.tablistLabel}
            id={tablistId}
          >
            {product.items.map((beat, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  key={beat.title}
                  type="button"
                  role="tab"
                  id={`${tablistId}-tab-${index}`}
                  aria-selected={selected}
                  aria-controls={`${tablistId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  className={cn(
                    "landing-evidence-tab",
                    selected && "is-active",
                  )}
                  onClick={() => selectBeatManual(index)}
                  onMouseEnter={() => prefetchBeat(index)}
                  onFocus={() => prefetchBeat(index)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                      return;
                    }
                    event.preventDefault();
                    const delta = event.key === "ArrowRight" ? 1 : -1;
                    const next =
                      (index + delta + product.items.length) %
                      product.items.length;
                    selectBeatManual(next);
                    requestAnimationFrame(() => {
                      document
                        .getElementById(`${tablistId}-tab-${next}`)
                        ?.focus();
                    });
                  }}
                >
                  {beat.title}
                </button>
              );
            })}
          </div>

          <div
            className="landing-evidence-panel"
            role="tabpanel"
            id={`${tablistId}-panel`}
            aria-labelledby={`${tablistId}-tab-${activeIndex}`}
          >
            <div
              className={cn(
                "landing-evidence-copy",
                copyFading && "is-fading",
              )}
            >
              <h3 className="landing-evidence-beat-title">
                {active.benefitTitle}
              </h3>
              <p className="landing-muted-text mt-3 text-base leading-relaxed">
                {active.description}
              </p>
              <ul className="mt-5 space-y-2">
                {active.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2 text-base"
                  >
                    <span
                      className="landing-check mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                      aria-hidden
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <div className="landing-evidence-preview">
              <LandingProductPreview
                backdrop={false}
                carouselMotion
                activeNavIndex={
                  (product.items[activeIndex] ?? active).previewNavIndex
                }
                assetId={
                  (product.items[activeIndex] ?? active).previewAssetId
                }
              />
            </div>
          </div>

          {beatCount > 1 ? (
            <div
              className="landing-evidence-dots"
              role="group"
              aria-label="Progreso del recorrido"
            >
              {product.items.map((beat, index) => (
                <button
                  key={beat.title}
                  type="button"
                  className={cn(
                    "landing-evidence-dot",
                    index === activeIndex && "is-active",
                  )}
                  aria-label={`${beat.title}${index === activeIndex ? ", actual" : ""}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => selectBeatManual(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const { pricing } = landingCopy;
  const { plans } = usePublicOperationalPlans();
  const { open: registrationOpen } = usePublicSelfServeRegister();
  const [fleetOptionId, setFleetOptionId] = useState<string>(
    pricing.fleetSelector.defaultOptionId,
  );
  const highlightedCode = planCodeForFleetOption(fleetOptionId);
  const matchPlan = plans.find((p) => p.code === highlightedCode);
  const matchColRef = useRef<HTMLElement | null>(null);
  const skipMatchScrollRef = useRef(true);

  /* D7: en stack mobile, anclar la banda match al cambiar flota (no en mount). */
  useEffect(() => {
    if (skipMatchScrollRef.current) {
      skipMatchScrollRef.current = false;
      return;
    }
    const col = matchColRef.current;
    if (!col || typeof window === "undefined") return;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    if (!mobile) return;
    col.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [highlightedCode]);

  return (
    <section
      id={pricing.id}
      className="landing-band landing-band-muted landing-pricing scroll-mt-20 py-16 md:py-20"
    >
      <div className="landing-shell">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="landing-section-title">{pricing.title}</h2>
          <p className="landing-muted-text mt-4 text-base md:text-lg">
            {pricing.subtitle}
          </p>
          <p className="landing-muted-text mt-2 text-sm">
            {registrationOpen ? pricing.priceHint : pricing.priceHintClosed}
          </p>
        </div>

        <LandingFleetSizeSelector
          value={fleetOptionId}
          onChange={(optionId) => setFleetOptionId(optionId)}
          matchBandName={matchPlan?.shortName}
        />

        <div className="landing-plan-table" role="list">
          {plans.map((plan) => {
            const isPopular = plan.code === pricing.popularCode;
            const isFleetMatch = plan.code === highlightedCode;
            const audience = pricing.audiences[plan.code] ?? plan.unitsLabel;
            const fleetRangeLabel = fleetUnitsLabelForLanding(plan.unitsLabel);
            const isQuote =
              plan.code === "operacion_grande" ||
              plan.priceAmount === "Cotización" ||
              !plan.pricePeriod;

            return (
              <article
                key={plan.code}
                ref={isFleetMatch ? matchColRef : undefined}
                role="listitem"
                data-plan-code={plan.code}
                className={cn(
                  "landing-plan-col",
                  isPopular && "is-popular",
                  isFleetMatch && "is-fleet-match",
                )}
              >
                <p className="landing-plan-eyebrow">
                  {isPopular ? pricing.popularBadge : fleetRangeLabel}
                </p>

                <h3 className="landing-plan-name">{plan.shortName}</h3>

                {/* P2: precio + audience + CTA antes de specs (escaneo Unsection). */}
                <p className="landing-plan-price-row mt-4 flex flex-wrap items-baseline gap-1.5">
                  <span
                    className={cn(
                      "landing-price-amount",
                      isFleetMatch
                        ? "text-[color:var(--landing-brand)]"
                        : "text-[color:var(--landing-ink)]",
                    )}
                  >
                    {plan.priceAmount}
                  </span>
                  {plan.pricePeriod ? (
                    <span className="landing-plan-period">
                      {plan.pricePeriod}
                    </span>
                  ) : null}
                </p>

                <p className="landing-plan-audience">{audience}</p>

                <div className="landing-plan-actions">
                  {/* F1: CTA ámbar solo en fleet-match; cotización Grande siempre outline. */}
                  <Button
                    className={cn(
                      "w-full",
                      isFleetMatch && !isQuote
                        ? "landing-cta-amber"
                        : "landing-btn-outline-ink",
                    )}
                    size="lg"
                    variant={
                      isFleetMatch && !isQuote ? "default" : "outline"
                    }
                    asChild
                  >
                    {isQuote ? (
                      <a href="mailto:ventas@boeltech.com">
                        {pricing.ctaQuote}
                      </a>
                    ) : registrationOpen ? (
                      <Link to="/register">{pricing.cta}</Link>
                    ) : (
                      <a href="mailto:ventas@boeltech.com">
                        {landingCopy.nav.contactSales}
                      </a>
                    )}
                  </Button>
                  {registrationOpen && !isQuote ? (
                    <Button
                      className="landing-btn-ghost-ink w-full"
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <a href="mailto:ventas@boeltech.com">
                        {pricing.ctaSecondary}
                      </a>
                    </Button>
                  ) : null}
                </div>

                <dl className="landing-plan-specs">
                  <div className="landing-plan-spec">
                    <dt className="landing-plan-spec-label">
                      {pricing.featureLabels.fleet}
                    </dt>
                    <dd className="landing-plan-spec-value">
                      {fleetRangeLabel}
                    </dd>
                  </div>
                  <div className="landing-plan-spec">
                    <dt className="landing-plan-spec-label">
                      {pricing.featureLabels.users}
                    </dt>
                    <dd className="landing-plan-spec-value">
                      {plan.usersBadge}
                    </dd>
                  </div>
                  <div className="landing-plan-spec">
                    <dt className="landing-plan-spec-label">
                      {pricing.featureLabels.branches}
                    </dt>
                    <dd className="landing-plan-spec-value">
                      {plan.branchesBadge}
                    </dd>
                  </div>
                  {plan.stampsBadge ? (
                    <div className="landing-plan-spec">
                      <dt className="landing-plan-spec-label">
                        {pricing.featureLabels.stamps}
                      </dt>
                      <dd className="landing-plan-spec-value">
                        {plan.stampsBadge}
                      </dd>
                    </div>
                  ) : null}
                  {plan.historyLabel ? (
                    <div className="landing-plan-spec">
                      <dt className="landing-plan-spec-label">
                        {pricing.featureLabels.history}
                      </dt>
                      <dd className="landing-plan-spec-value">
                        {plan.historyLabel}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })}
        </div>

        {/* F3 D6: un solo footnote de sección (anual + opcionales + link). */}
        <p className="landing-pricing-footnote">
          {pricing.annualNote} {pricing.optionalsNote}{" "}
          <a
            href={`#${landingCopy.optionals.id}`}
            className="font-medium text-[color:var(--landing-brand)] hover:underline"
          >
            {pricing.optionalsLink}
          </a>
        </p>
      </div>
    </section>
  );
};

const OptionalsSection = () => {
  const { optionals } = landingCopy;
  return (
    <section
      id={optionals.id}
      className="landing-optionals scroll-mt-20"
    >
      <div className="landing-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-optionals-badge">{optionals.badge}</p>
          <h2 className="landing-section-title">{optionals.title}</h2>
          <p className="landing-muted-text mt-4 text-base leading-relaxed">
            {optionals.subtitle}
          </p>
        </div>

        <div
          className="landing-optionals-bento mx-auto max-w-5xl"
          role="list"
        >
          {optionals.items.map((item) => (
            <div
              key={item.title}
              className="landing-optionals-cell"
              role="listitem"
            >
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>

        <p className="landing-optionals-footnote">{optionals.footnote}</p>
      </div>
    </section>
  );
};

const CTASection = () => {
  const { cta } = landingCopy;
  const { open: registrationOpen } = usePublicSelfServeRegister();
  return (
    <section className="landing-cta-band">
      <div className="landing-shell">
        <LandingReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="landing-section-title">
              {registrationOpen ? cta.title : cta.closedTitle}
            </h2>
            <p className="landing-cta-support mx-auto mt-4 max-w-2xl">
              {registrationOpen ? cta.subtitle : cta.closedSubtitle}
            </p>
            {registrationOpen ? (
              <p className="landing-cta-hint mt-2 text-sm">{cta.trialHint}</p>
            ) : null}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              {registrationOpen ? (
                <Button
                  size="lg"
                  asChild
                  className="landing-cta-amber"
                >
                  <Link to="/register">
                    {cta.primary}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  asChild
                  className="landing-cta-amber"
                >
                  <a href="mailto:ventas@boeltech.com">
                    {cta.closedPrimary}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="landing-btn-outline-on-ink"
                asChild
              >
                {registrationOpen ? (
                  <a href="mailto:ventas@boeltech.com">{cta.secondary}</a>
                ) : (
                  <Link to="/login">{landingCopy.nav.login}</Link>
                )}
              </Button>
            </div>
          </div>
        </LandingReveal>
      </div>
    </section>
  );
};

/** Sticky CTA mobile post-hero (F3). No cuenta como LandingReveal. */
const StickyMobileCta = () => {
  const { stickyCta, nav, hero } = landingCopy;
  const { open: registrationOpen } = usePublicSelfServeRegister();
  const [visible, setVisible] = useState(false);
  const shownOnce = useRef(false);

  useEffect(() => {
    const heroEl = document.querySelector("[data-landing-hero]");
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const pastHero = entry ? !entry.isIntersecting : false;
        setVisible(pastHero);
        if (pastHero) shownOnce.current = true;
      },
      { threshold: 0.08, rootMargin: "0px" },
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "landing-sticky-cta",
        visible && "is-visible",
      )}
      data-landing-sticky-cta
      aria-hidden={!visible}
    >
      <div
        className="landing-sticky-cta-inner"
        role="region"
        aria-label={stickyCta.ariaLabel}
      >
        {registrationOpen ? (
          <Button asChild size="sm" className="landing-cta-amber flex-1">
            <Link to="/register">{nav.register}</Link>
          </Button>
        ) : (
          <Button asChild size="sm" className="landing-cta-amber flex-1">
            <a href="mailto:ventas@boeltech.com">{nav.contactSales}</a>
          </Button>
        )}
        <a
          href={`#${landingCopy.pricing.id}`}
          className="landing-sticky-cta-pricing"
        >
          {stickyCta.pricingLink}
        </a>
        <span className="sr-only">
          {registrationOpen ? hero.ctaPrimaryOpen : hero.ctaPrimaryClosed}
        </span>
      </div>
    </div>
  );
};

const Footer = () => {
  const { brandByline, footer, nav } = landingCopy;
  return (
    <footer className="landing-footer pb-10 pt-10 md:pt-12">
      <div className="landing-shell">
        <div className="grid gap-10 border-b border-[color:var(--landing-hairline)] pb-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex flex-col gap-1.5">
              <Wordmark variant="brand" className="text-xl" />
              <p className="landing-muted-text text-xs">{brandByline}</p>
            </div>
            <p className="landing-muted-text mt-3 text-sm leading-relaxed">
              {footer.tagline}
            </p>
          </div>

          <div>
            <p className="landing-footer-heading">{footer.product}</p>
            <nav className="flex flex-col gap-2" aria-label="Producto">
              <a
                href={`#${landingCopy.evidence.id}`}
                className="text-sm"
              >
                {nav.product}
              </a>
              <a
                href={`#${landingCopy.pricing.id}`}
                className="text-sm"
              >
                {nav.pricing}
              </a>
            </nav>
          </div>

          <div>
            <p className="landing-footer-heading">{footer.legal}</p>
            <nav className="flex flex-col gap-2" aria-label="Legal">
              <Link to="/terms" className="text-sm">
                {footer.terms}
              </Link>
              <Link to="/privacy" className="text-sm">
                {footer.privacy}
              </Link>
            </nav>
          </div>

          <div>
            <p className="landing-footer-heading">{footer.company}</p>
            <nav className="flex flex-col gap-2" aria-label="Empresa">
              <a href="mailto:soporte@boeltech.com" className="text-sm">
                {footer.support}
              </a>
              <a href="mailto:ventas@boeltech.com" className="text-sm">
                {nav.contactSales}
              </a>
              <Link to="/login" className="text-sm">
                {nav.login}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-6 border-t border-[color:var(--landing-hairline)] pt-6 text-center sm:text-left">
          <p className="landing-muted-text text-xs sm:text-sm">
            {footer.copyright(new Date().getFullYear())}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
