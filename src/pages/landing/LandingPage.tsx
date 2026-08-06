import { Link } from "react-router-dom";
import { ChevronRight, CheckCircle, UserPlus } from "lucide-react";
import { Button } from "@shared/ui/button";
import { BrandLockup, Wordmark } from "@shared/ui/brand";
import { cn } from "@shared/lib/utils/cn";
import { landingCopy } from "./landingCopy";
import { usePublicOperationalPlans } from "@shared/commercial/usePublicOperationalPlans";
import { usePublicSelfServeRegister } from "@shared/commercial/usePublicSelfServeRegister";
import { LandingReveal } from "./LandingReveal";
import { LandingHeroVisual } from "./LandingHeroVisual";
import "./landing.css";

/**
 * Landing pública (`/welcome`): embudo D1–D7 (Capa 1).
 * Look: «Industrial confiable / blueprint elevado» (landing-visual-polish).
 * Banding: primary(+trust) → surface → secondary → surface → secondary(+primary CTA).
 * Ver `.landing-band-*` en landing.css (par background / secondary).
 */
const LandingPage = () => {
  return (
    <div className="bg-background relative min-h-screen overflow-x-hidden">
      <div className="landing-mesh pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div
        className="landing-grain pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      />

      <Header />
      <HeroSection />
      <ProductSection />
      <PricingSection />
      <OptionalsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

const Header = () => {
  const { brand, nav } = landingCopy;
  const { open: registrationOpen } = usePublicSelfServeRegister();

  const navLinks = [
    { href: `#${landingCopy.product.id}`, label: nav.product },
    { href: `#${landingCopy.pricing.id}`, label: nav.pricing },
    { href: `#${landingCopy.optionals.id}`, label: nav.optionals },
  ];

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-50 border-b">
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
          className="hidden items-center gap-6 md:flex"
          aria-label="Secciones"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">{nav.login}</Link>
          </Button>
          {registrationOpen ? (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/register">
                <UserPlus className="mr-2 h-4 w-4" />
                {nav.register}
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="hidden sm:inline-flex"
              variant="outline"
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
    <section className="landing-hero relative overflow-hidden">
      {/* Banda sólida primary (DS) — copy + visual + trust fiscal */}
      <div className="landing-hero-band bg-primary text-primary-foreground">
        <div className="landing-shell pt-12 pb-10 md:pt-16 md:pb-12 lg:pt-20 lg:pb-14">
          <div className="grid items-center gap-8 md:gap-10 lg:grid-cols-2 lg:gap-10 xl:gap-14">
            <div className="landing-hero-copy relative z-10 mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
              <LandingReveal delayMs={0}>
                <div className="mb-5 flex flex-col items-center lg:mb-7 lg:items-start">
                  <BrandLockup
                    variant="onBrand"
                    decorative
                    markSize={40}
                    wordmarkClassName="text-2xl tracking-tight sm:text-3xl lg:text-[2rem]"
                  />
                  <span className="landing-hero-brand-rule" aria-hidden />
                </div>
              </LandingReveal>

              <LandingReveal delayMs={90}>
                <h1 className="landing-display text-primary-foreground">
                  {hero.title}
                </h1>
                <p className="landing-hero-support text-primary-foreground/80 mx-auto mt-6 text-base md:text-lg lg:mx-0">
                  {hero.subtitle}
                </p>
              </LandingReveal>

              <LandingReveal delayMs={180}>
                <div className="mt-9 flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center sm:gap-5 lg:justify-start">
                  {registrationOpen ? (
                    <Button
                      size="lg"
                      variant="secondary"
                      asChild
                      className="landing-hero-cta min-w-[210px]"
                    >
                      <Link to="/register">
                        {hero.ctaPrimaryOpen}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="secondary"
                      asChild
                      className="landing-hero-cta min-w-[210px]"
                    >
                      <a href="mailto:ventas@boeltech.com">
                        {hero.ctaPrimaryClosed}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </a>
                    </Button>
                  )}
                  <Link
                    to="/login"
                    className="text-primary-foreground/85 hover:text-primary-foreground text-sm font-medium underline-offset-4 transition-colors hover:underline"
                  >
                    {hero.ctaLogin}
                  </Link>
                </div>
                <p className="text-primary-foreground/70 mt-4 flex items-center justify-center gap-2 text-sm lg:justify-start">
                  {registrationOpen ? (
                    <>
                      <span
                        className="bg-primary-foreground/80 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
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

            <LandingReveal
              className="landing-preview-rise landing-hero-visual-wrap"
              delayMs={120}
            >
              <LandingHeroVisual />
            </LandingReveal>
          </div>
        </div>

        {/* Trust fiscal — misma banda primary (contraste onBrand) */}
        <div className="landing-hero-trust landing-shell">
          <LandingReveal delayMs={40}>
            <TrustStrip />
          </LandingReveal>
        </div>
      </div>
    </section>
  );
};

/** Trust fiscal tipográfico (D4); pie de la banda primary del hero. */
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
          <span className="landing-hero-trust-label font-medium">
            {item.label}
          </span>
          <span className="landing-hero-trust-hint"> {item.hint}</span>
        </span>
      ))}
    </p>
  );
};

const ProductSection = () => {
  const { product } = landingCopy;
  return (
    <section
      id={product.id}
      className="landing-band landing-band-surface py-16 md:py-20"
    >
      <div className="landing-shell">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <h2 className="landing-section-title text-foreground">
            {product.title}
          </h2>
          <p className="text-muted-foreground mt-4">{product.subtitle}</p>
        </LandingReveal>

        <div className="landing-panel landing-reveal-stagger border-border/60 mt-12 overflow-hidden rounded-2xl border">
          <div className="grid md:grid-cols-2">
            {product.items.map((module, index) => {
              const n = String(index + 1).padStart(2, "0");
              return (
                <LandingReveal
                  key={module.title}
                  className={cn(
                    "border-border/50 p-6 md:p-8",
                    index % 2 === 1 && "md:border-l",
                    index >= 2 && "border-t",
                  )}
                >
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <span className="text-primary/70 font-mono text-xs font-medium tracking-widest">
                      {n}
                    </span>
                    <span className="text-primary bg-primary/8 rounded px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase">
                      {product.includedBadge}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight">
                    {module.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-base leading-relaxed">
                    {module.description}
                  </p>
                  <ul className="space-y-2">
                    {module.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-center gap-2 text-base"
                      >
                        <CheckCircle className="text-primary h-4 w-4 shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </LandingReveal>
              );
            })}
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

  return (
    <section
      id={pricing.id}
      className="landing-band landing-band-muted py-16 md:py-24"
    >
      <div className="landing-shell">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <h2 className="landing-section-title text-foreground">
            {pricing.title}
          </h2>
          <p className="text-muted-foreground mt-4 text-base md:text-lg">
            {pricing.subtitle}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {registrationOpen ? pricing.priceHint : pricing.priceHintClosed}
          </p>
        </LandingReveal>

        <div className="landing-panel landing-reveal-stagger border-border/60 mt-14 overflow-hidden rounded-2xl border xl:grid xl:grid-cols-4">
          {plans.map((plan, index) => {
            const isPopular = plan.code === pricing.popularCode;
            const audience = pricing.audiences[plan.code] ?? plan.unitsLabel;

            return (
              <LandingReveal key={plan.code}>
                <article
                  className={cn(
                    "landing-plan relative flex h-full flex-col border-border/50 p-6 md:p-7",
                    index > 0 && "border-t xl:border-t-0 xl:border-l",
                    isPopular &&
                      "landing-plan-popular bg-primary/[0.04] ring-primary/25 xl:z-[1] xl:ring-2",
                  )}
                >
                  {isPopular ? (
                    <p className="text-primary mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase">
                      {pricing.popularBadge}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mb-3 text-[11px] font-medium tracking-[0.14em] uppercase">
                      {pricing.familyLabel}
                    </p>
                  )}

                  <h3
                    className={cn(
                      "text-xl font-bold tracking-tight",
                      isPopular ? "text-primary" : "text-foreground",
                    )}
                  >
                    {plan.shortName}
                  </h3>

                  <p className="mt-4 flex flex-wrap items-baseline gap-1">
                    <span
                      className={cn(
                        "landing-price-amount",
                        isPopular ? "text-primary" : "text-foreground",
                      )}
                    >
                      {plan.priceAmount}
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">
                      {plan.pricePeriod}
                    </span>
                  </p>

                  <p className="text-muted-foreground mt-3 min-h-[2.75rem] text-sm leading-relaxed">
                    {audience}
                  </p>

                  <div className="bg-border my-5 h-px w-full" />

                  <ul className="flex-1 space-y-3 text-sm">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <span className="text-muted-foreground">
                          {pricing.featureLabels.fleet}:{" "}
                        </span>
                        <span className="font-medium">{plan.unitsLabel}</span>
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground flex items-center gap-2.5">
                        <CheckCircle className="text-primary h-4 w-4 shrink-0" />
                        {pricing.featureLabels.users}
                      </span>
                      <span className="text-foreground text-sm font-medium tabular-nums">
                        {plan.usersBadge}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground flex items-center gap-2.5">
                        <CheckCircle className="text-primary h-4 w-4 shrink-0" />
                        {pricing.featureLabels.branches}
                      </span>
                      <span className="text-foreground text-sm font-medium tabular-nums">
                        {plan.branchesBadge}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground flex items-center gap-2.5">
                        <CheckCircle className="text-primary h-4 w-4 shrink-0" />
                        {pricing.featureLabels.stamps}
                      </span>
                      <span className="text-foreground text-sm font-medium tabular-nums">
                        {plan.stampsBadge}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 pt-1">
                      <CheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-foreground text-sm">
                        {pricing.featureLabels.l0}
                      </span>
                    </li>
                  </ul>

                  <div className="mt-6 space-y-2">
                    <Button
                      className="w-full"
                      size="lg"
                      variant={isPopular ? "default" : "outline"}
                      asChild
                    >
                      {registrationOpen ? (
                        <Link to="/register">{pricing.cta}</Link>
                      ) : (
                        <a href="mailto:ventas@boeltech.com">
                          {landingCopy.nav.contactSales}
                        </a>
                      )}
                    </Button>
                    <Button className="w-full" size="sm" variant="ghost" asChild>
                      <a href="mailto:ventas@boeltech.com">
                        {pricing.ctaSecondary}
                      </a>
                    </Button>
                  </div>

                  <p className="text-muted-foreground mt-4 text-center text-[11px] leading-snug">
                    {brand} · {plan.name}
                  </p>
                </article>
              </LandingReveal>
            );
          })}
        </div>

        <LandingReveal className="text-muted-foreground mx-auto mt-10 max-w-2xl space-y-2 text-center text-sm">
          <p>{pricing.annualNote}</p>
          <p>
            {pricing.optionalsNote}{" "}
            <a
              href={`#${landingCopy.optionals.id}`}
              className="text-primary font-medium hover:underline"
            >
              Ver opcionales
            </a>
          </p>
        </LandingReveal>
      </div>
    </section>
  );
};

const OptionalsSection = () => {
  const { optionals } = landingCopy;
  return (
    <section
      id={optionals.id}
      className="landing-band landing-band-surface py-16 md:py-20"
    >
      <div className="landing-shell">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <h2 className="landing-section-title text-foreground">
            {optionals.title}
          </h2>
          <p className="text-muted-foreground mt-4">{optionals.subtitle}</p>
        </LandingReveal>

        <LandingReveal className="mt-12">
          <div className="landing-panel border-border/60 overflow-hidden rounded-2xl border">
            <div className="landing-reveal-stagger grid md:grid-cols-2 lg:grid-cols-4">
              {optionals.items.map((item, index) => {
                const n = String(index + 1).padStart(2, "0");
                return (
                  <LandingReveal
                    key={item.title}
                    className={cn(
                      "border-border/50 p-6",
                      index % 2 === 1 && "md:border-l",
                      index >= 2 && "border-t lg:border-t-0",
                      index >= 1 && "lg:border-l",
                    )}
                  >
                    <div className="mb-3 flex items-baseline justify-between gap-2">
                      <span className="text-muted-foreground/70 font-mono text-xs tracking-widest">
                        {n}
                      </span>
                      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        {optionals.badge}
                      </span>
                    </div>
                    <h3 className="mb-2 font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      {item.description}
                    </p>
                  </LandingReveal>
                );
              })}
            </div>
          </div>
        </LandingReveal>

        <LandingReveal>
          <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-xs">
            {optionals.footnote}
          </p>
        </LandingReveal>
      </div>
    </section>
  );
};

const CTASection = () => {
  const { cta } = landingCopy;
  const { open: registrationOpen } = usePublicSelfServeRegister();
  return (
    <section className="landing-band landing-band-muted py-16 md:py-20">
      <div className="landing-shell">
        <LandingReveal>
          <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl px-6 py-14 text-center md:px-12 md:py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              aria-hidden
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 55% 45% at 100% 0%, color-mix(in oklch, var(--primary-foreground) 16%, transparent), transparent 55%),
                  radial-gradient(ellipse 40% 35% at 0% 100%, color-mix(in oklch, var(--primary-foreground) 10%, transparent), transparent 50%)
                `,
              }}
            />
            <div className="relative z-10">
              <h2 className="landing-section-title text-primary-foreground">
                {registrationOpen ? cta.title : cta.closedTitle}
              </h2>
              <p className="text-primary-foreground/80 mx-auto mt-4 max-w-2xl">
                {registrationOpen ? cta.subtitle : cta.closedSubtitle}
              </p>
              {registrationOpen ? (
                <p className="text-primary-foreground/70 mt-2 text-sm">
                  {cta.trialHint}
                </p>
              ) : null}
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                {registrationOpen ? (
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/register">
                      {cta.primary}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" asChild>
                    <a href="mailto:ventas@boeltech.com">
                      {cta.closedPrimary}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10"
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
          </div>
        </LandingReveal>
      </div>
    </section>
  );
};

const Footer = () => {
  const { brandByline, footer, nav } = landingCopy;
  return (
    <footer className="landing-band landing-band-surface pb-10 pt-10 md:pt-12">
      <div className="landing-shell">
        <LandingReveal>
          <div className="grid gap-10 border-b pb-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex flex-col gap-1.5">
                <Wordmark variant="brand" className="text-xl" />
                <p className="text-muted-foreground text-xs">{brandByline}</p>
              </div>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {footer.tagline}
              </p>
              <p className="text-muted-foreground/80 mt-2 text-xs leading-relaxed">
                {footer.nameOrigin}
              </p>
            </div>

            <div>
              <p className="text-foreground mb-3 text-sm font-semibold">
                {footer.product}
              </p>
              <nav className="flex flex-col gap-2" aria-label="Producto">
                <a
                  href={`#${landingCopy.product.id}`}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {nav.product}
                </a>
                <a
                  href={`#${landingCopy.pricing.id}`}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {nav.pricing}
                </a>
                <a
                  href={`#${landingCopy.optionals.id}`}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {nav.optionals}
                </a>
              </nav>
            </div>

            <div>
              <p className="text-foreground mb-3 text-sm font-semibold">
                {footer.legal}
              </p>
              <nav className="flex flex-col gap-2" aria-label="Legal">
                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {footer.terms}
                </Link>
                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {footer.privacy}
                </Link>
              </nav>
            </div>

            <div>
              <p className="text-foreground mb-3 text-sm font-semibold">
                {footer.company}
              </p>
              <nav className="flex flex-col gap-2" aria-label="Empresa">
                <a
                  href="mailto:soporte@boeltech.com"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {footer.support}
                </a>
                <a
                  href="mailto:ventas@boeltech.com"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {nav.contactSales}
                </a>
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {nav.login}
                </Link>
              </nav>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-muted-foreground text-xs sm:text-sm">
              {footer.copyright(new Date().getFullYear())}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/terms"
                className="text-muted-foreground hover:text-foreground text-xs sm:text-sm"
              >
                {footer.terms}
              </Link>
              <Link
                to="/privacy"
                className="text-muted-foreground hover:text-foreground text-xs sm:text-sm"
              >
                {footer.privacy}
              </Link>
            </div>
          </div>
        </LandingReveal>
      </div>
    </footer>
  );
};

export default LandingPage;
