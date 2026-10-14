import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, UserPlus } from "lucide-react";
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
import "./landing.css";

function planCodeForFleetOption(optionId: string): string {
  const match = landingCopy.pricing.fleetSelector.options.find(
    (o) => o.id === optionId,
  );
  return match?.planCode ?? landingCopy.pricing.popularCode;
}

/**
 * Landing pública (`/welcome`): embudo D1–D12 · look «Señal de patio» (F2+F3).
 * Secuencia F3: Hero(+UI) → Trust → Evidencia → Precios → FAQ → CTA → Opcionales → Footer.
 * Máx. 3 LandingReveal: hero copy (eager), preview, CTA cierre.
 * Path-draw SVG en hero: omitido (F2 truck/route bastan; reduced-motion ya cubierto).
 */
const LandingPage = () => {
  return (
    <div className="landing-root relative min-h-screen overflow-x-hidden">
      <a href="#contenido" className="landing-skip sr-only focus:not-sr-only">
        {landingCopy.skipLink}
      </a>

      <Header />
      <main id="contenido">
        <HeroSection />
        <EvidenceSection />
        <PricingSection />
        <LandingFaq />
        <CTASection />
        <OptionalsSection />
      </main>
      <Footer />
      <StickyMobileCta />
    </div>
  );
};

const Header = () => {
  const { brand, nav } = landingCopy;
  const { open: registrationOpen } = usePublicSelfServeRegister();

  const navLinks = [
    { href: `#${landingCopy.evidence.id}`, label: nav.product },
    { href: `#${landingCopy.pricing.id}`, label: nav.pricing },
  ];

  return (
    <header className="landing-header sticky top-0 z-50">
      <div className="landing-shell flex h-16 items-center justify-between gap-3">
        <Link
          to="/welcome"
          className="flex shrink-0 items-center gap-2"
          aria-label={brand}
        >
          <BrandLockup
            variant="brand"
            decorative
            markSize={32}
            wordmarkClassName="text-xl sm:text-2xl"
          />
        </Link>

        <nav
          className="landing-header-nav hidden items-center gap-6 md:flex"
          aria-label="Secciones"
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a
            href={`#${landingCopy.pricing.id}`}
            className="landing-muted-text hover:text-[color:var(--landing-ink)] text-sm font-medium transition-colors md:hidden"
          >
            {nav.pricing}
          </a>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="landing-btn-ghost-ink"
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
              className="landing-btn-outline-ink"
            >
              <a href="mailto:ventas@boeltech.com">{nav.contactSales}</a>
            </Button>
          )}
        </div>
      </div>
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

      <div className="landing-shell landing-hero-content">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="landing-hero-copy relative z-10 mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <LandingReveal eager>
              <div className="landing-hero-brand mb-6 flex flex-col items-center gap-0 lg:items-start">
                <BrandLockup
                  variant="onBrand"
                  markSize={40}
                  wordmarkClassName="text-2xl sm:text-3xl"
                />
                <span className="landing-hero-brand-rule" aria-hidden />
              </div>

              <h1 className="landing-display text-[color:var(--landing-on-dark)]">
                {hero.title}
              </h1>
              <p className="landing-hero-support mx-auto mt-6 text-base md:text-lg lg:mx-0">
                {hero.subtitle}
              </p>

              <div className="mt-9 flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center sm:gap-5 lg:justify-start">
                {registrationOpen ? (
                  <Button
                    size="lg"
                    asChild
                    className="landing-hero-cta landing-cta-amber min-w-[210px]"
                  >
                    <Link to="/register">
                      {hero.ctaPrimaryOpen}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
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
                )}
                <Link
                  to="/login"
                  className="landing-link-onbrand text-sm font-medium text-[color:var(--landing-on-dark)]/85 underline-offset-4 transition-colors hover:underline"
                >
                  {hero.ctaLogin}
                </Link>
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[color:var(--landing-on-dark)]/70 lg:justify-start">
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

          {/* Preview junto al hero (prueba visual near fold) */}
          <LandingReveal className="landing-preview-rise relative z-10">
            <LandingProductPreview backdrop={false} />
          </LandingReveal>
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

/** F3: tabs + mock narrado (A3 placeholder = preview/mock actual). */
const EvidenceSection = () => {
  const { evidence, product } = landingCopy;
  const [activeIndex, setActiveIndex] = useState(0);
  const active = product.items[activeIndex] ?? product.items[0]!;
  const tablistId = "landing-evidence-tabs";

  return (
    <section
      id={evidence.id}
      className="landing-band landing-band-surface landing-evidence scroll-mt-20 py-16 md:py-20"
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
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                      return;
                    }
                    event.preventDefault();
                    const delta = event.key === "ArrowRight" ? 1 : -1;
                    const next =
                      (index + delta + product.items.length) %
                      product.items.length;
                    setActiveIndex(next);
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
            <div className="landing-evidence-copy">
              <h3 className="landing-evidence-beat-title">{active.title}</h3>
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
              {/* A3: sin crops reales — mismo mock narrado por beat */}
              <LandingProductPreview
                backdrop={false}
                activeNavIndex={active.previewNavIndex}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const { pricing, brand } = landingCopy;
  const { plans } = usePublicOperationalPlans();
  const { open: registrationOpen } = usePublicSelfServeRegister();
  const [fleetOptionId, setFleetOptionId] = useState<string>(
    pricing.fleetSelector.defaultOptionId,
  );
  const highlightedCode = planCodeForFleetOption(fleetOptionId);

  return (
    <section
      id={pricing.id}
      className="landing-band landing-band-muted scroll-mt-20 py-16 md:py-24"
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
        />

        <div className="landing-plan-table" role="list">
          {plans.map((plan) => {
            const isPopular = plan.code === pricing.popularCode;
            const isFleetMatch = plan.code === highlightedCode;
            const audience = pricing.audiences[plan.code] ?? plan.unitsLabel;
            const isQuote =
              plan.code === "operacion_grande" ||
              plan.priceAmount === "Cotización" ||
              !plan.pricePeriod;

            return (
              <article
                key={plan.code}
                role="listitem"
                data-plan-code={plan.code}
                className={cn(
                  "landing-plan-col",
                  isPopular && "is-popular",
                  isFleetMatch && "is-fleet-match",
                )}
              >
                <p className="landing-plan-eyebrow">
                  {isPopular ? pricing.popularBadge : pricing.familyLabel}
                </p>

                <h3 className="landing-plan-name">{plan.shortName}</h3>

                <p className="mt-4 flex flex-wrap items-baseline gap-1.5">
                  <span
                    className={cn(
                      "landing-price-amount",
                      isFleetMatch
                        ? "text-[color:var(--landing-blueprint)]"
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

                <dl className="landing-plan-specs">
                  <div className="landing-plan-spec">
                    <dt className="landing-plan-spec-label">
                      {pricing.featureLabels.fleet}
                    </dt>
                    <dd className="landing-plan-spec-value">
                      {plan.unitsLabel}
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
                  <div className="landing-plan-spec">
                    <dt className="landing-plan-spec-label">
                      {pricing.featureLabels.l0}
                    </dt>
                    <dd className="landing-plan-spec-value">Incluido</dd>
                  </div>
                </dl>

                <div className="landing-plan-actions">
                  <Button
                    className={cn(
                      "w-full",
                      isPopular || isFleetMatch
                        ? "landing-cta-amber"
                        : "landing-btn-outline-ink",
                    )}
                    size="lg"
                    variant={isPopular || isFleetMatch ? "default" : "outline"}
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

                <p className="landing-plan-footnote">
                  {brand} · {plan.name}
                </p>
              </article>
            );
          })}
        </div>

        <div className="landing-muted-text mx-auto mt-10 max-w-2xl space-y-2 text-center text-sm">
          <p>{pricing.annualNote}</p>
          <p>
            {pricing.optionalsNote}{" "}
            <a
              href={`#${landingCopy.optionals.id}`}
              className="font-medium text-[color:var(--landing-blueprint)] hover:underline"
            >
              {pricing.optionalsLink}
            </a>
          </p>
        </div>
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

        <div className="landing-optionals-strip mx-auto max-w-5xl">
          {optionals.items.map((item) => (
            <div key={item.title} className="landing-optionals-item">
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
