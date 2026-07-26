import { Link } from "react-router-dom";
import {
  Truck,
  Route,
  Users,
  BarChart3,
  FileText,
  Shield,
  ChevronRight,
  CheckCircle,
  Fuel,
  Wrench,
  Satellite,
  UserPlus,
  Building2,
  Wallet,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import { landingCopy } from "./landingCopy";
import { usePublicOperationalPlans } from "@shared/commercial/usePublicOperationalPlans";
import { usePublicSelfServeRegister } from "@shared/commercial/usePublicSelfServeRegister";
import { LandingReveal } from "./LandingReveal";
import { LandingProductPreview } from "./LandingProductPreview";
import "./landing.css";

const featureIcons: LucideIcon[] = [Clock, Shield, BarChart3, FileText];
const includedIcons: LucideIcon[] = [Truck, Route, Users, Wallet];
const addonIcons: LucideIcon[] = [Fuel, Wrench, Satellite, Building2];

/**
 * Landing pública (`/welcome`): núcleo L0 vs add-ons, trial SoT §6.6, legales reales.
 * Visual: patrones SaasAble (shells, nav pill, preview, reveal) con tokens OKLCH.
 */
const LandingPage = () => {
  return (
    <div className="bg-background relative min-h-screen overflow-x-hidden">
      <div
        className="landing-dot-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.45]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 70% 45% at 50% -10%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 55%)
          `,
        }}
      />

      <Header />
      <HeroSection />
      <TrustStrip />
      <FeaturesSection />
      <IncludedSection />
      <PricingSection />
      <AddonsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

const Header = () => {
  const { brand, nav } = landingCopy;
  const { open: registrationOpen } = usePublicSelfServeRegister();

  const navLinks = [
    { href: `#${landingCopy.features.id}`, label: nav.features },
    { href: `#${landingCopy.included.id}`, label: nav.included },
    { href: `#${landingCopy.pricing.id}`, label: nav.pricing },
    { href: `#${landingCopy.addons.id}`, label: nav.addons },
  ];

  return (
    <header className="bg-background/90 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link to="/welcome" className="flex shrink-0 items-center gap-2">
          <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
            <Truck className="text-primary-foreground h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight sm:text-xl">
            {brand}
          </span>
        </Link>

        <nav
          className="bg-muted/80 hidden items-center gap-1 rounded-full px-1.5 py-1 md:flex"
          aria-label="Secciones"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
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
  const { hero, brand } = landingCopy;
  const { open: registrationOpen } = usePublicSelfServeRegister();

  return (
    <section className="relative overflow-hidden pt-16 pb-8 md:pt-24 md:pb-10">
      <div className="container mx-auto px-4 text-center">
        <LandingReveal>
          <p className="text-primary mb-3 text-sm font-semibold tracking-wide">
            {brand}
          </p>
          <div className="bg-primary/10 text-primary border-primary/20 mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="bg-success mr-2 flex h-2 w-2 animate-pulse rounded-full" />
            {hero.badge}
          </div>

          <h1 className="text-foreground mx-auto max-w-4xl text-4xl font-bold tracking-tight text-balance md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {hero.title}
          </h1>

          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-base leading-relaxed md:text-lg">
            {hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            {registrationOpen ? (
              <Button size="lg" asChild className="min-w-[200px]">
                <Link to="/register">
                  {hero.ctaPrimary}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild className="min-w-[200px]">
                <a href="mailto:ventas@boeltech.com">
                  {landingCopy.nav.contactSales}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild className="min-w-[200px]">
              <Link to="/login">{hero.ctaSecondary}</Link>
            </Button>
          </div>
          {registrationOpen ? (
            <p className="text-muted-foreground mt-4 text-sm">{hero.trialHint}</p>
          ) : null}
        </LandingReveal>

        <LandingReveal className="mt-12 md:mt-16" delayMs={80}>
          <LandingProductPreview />
        </LandingReveal>
      </div>
    </section>
  );
};

const TrustStrip = () => {
  const { trust } = landingCopy;
  return (
    <section className="py-10 md:py-12" aria-label={trust.ariaLabel}>
      <div className="container mx-auto px-4">
        <LandingReveal>
          <div className="bg-muted/50 border-border/60 flex flex-wrap items-center justify-center gap-2 rounded-3xl border px-4 py-5 sm:gap-3 sm:px-6">
            {trust.items.map((item) => (
              <div
                key={item.label}
                className="bg-background/80 border-border/70 flex min-w-[140px] flex-col items-center rounded-full border px-5 py-2.5 text-center shadow-sm sm:min-w-[160px]"
              >
                <span className="text-foreground text-sm font-semibold">
                  {item.label}
                </span>
                <span className="text-muted-foreground text-xs">{item.hint}</span>
              </div>
            ))}
          </div>
        </LandingReveal>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const { features } = landingCopy;
  return (
    <section id={features.id} className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {features.title}
          </h2>
          <p className="text-muted-foreground mt-4">{features.subtitle}</p>
        </LandingReveal>

        <LandingReveal className="mt-12">
          <div className="bg-muted/40 border-border/50 overflow-hidden rounded-3xl border">
            <div className="landing-reveal-stagger grid md:grid-cols-2 lg:grid-cols-4">
              {features.items.map((feature, index) => {
                const Icon = featureIcons[index] ?? CheckCircle;
                return (
                  <LandingReveal
                    key={feature.title}
                    className={cn(
                      "border-border/50 p-6 md:p-8",
                      index % 2 === 1 && "md:border-l",
                      index >= 2 && "border-t lg:border-t-0",
                      index >= 1 && "lg:border-l",
                    )}
                  >
                    <div className="bg-primary/15 text-primary mb-4 flex h-11 w-11 items-center justify-center rounded-full">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-base font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </LandingReveal>
                );
              })}
            </div>
          </div>
        </LandingReveal>
      </div>
    </section>
  );
};

const IncludedSection = () => {
  const { included } = landingCopy;
  return (
    <section id={included.id} className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {included.title}
          </h2>
          <p className="text-muted-foreground mt-4">{included.subtitle}</p>
        </LandingReveal>

        <div className="landing-reveal-stagger mt-12 grid gap-4 md:grid-cols-2">
          {included.items.map((module, index) => {
            const Icon = includedIcons[index] ?? Truck;
            return (
              <LandingReveal
                key={module.title}
                className="bg-muted/35 border-border/50 rounded-3xl border p-6 md:p-7"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="bg-primary text-primary-foreground flex h-11 w-11 items-center justify-center rounded-2xl">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="success" tone="soft">
                    Incluido
                  </Badge>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{module.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {module.description}
                </p>
                <ul className="space-y-2">
                  {module.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-center gap-2 text-sm"
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
    </section>
  );
};

const PricingSection = () => {
  const { pricing, brand } = landingCopy;
  const { plans } = usePublicOperationalPlans();
  const { open: registrationOpen } = usePublicSelfServeRegister();

  return (
    <section id={pricing.id} className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {pricing.title}
          </h2>
          <p className="text-muted-foreground mt-4 text-base md:text-lg">
            {pricing.subtitle}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">{pricing.priceHint}</p>
        </LandingReveal>

        <div className="landing-reveal-stagger mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
          {plans.map((plan) => {
            const isPopular = plan.code === pricing.popularCode;
            const audience = pricing.audiences[plan.code] ?? plan.unitsLabel;

            return (
              <LandingReveal key={plan.code}>
                <article
                  className={cn(
                    "bg-muted/40 relative flex h-full flex-col rounded-3xl border p-6 transition-shadow",
                    isPopular
                      ? "border-primary bg-card ring-primary/20 shadow-md ring-2 xl:-translate-y-1"
                      : "border-border/60 hover:border-primary/30",
                  )}
                >
                  {isPopular ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="info" tone="soft" className="shadow-sm">
                        {pricing.popularBadge}
                      </Badge>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl",
                        isPopular
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <Truck className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {pricing.familyLabel}
                    </span>
                  </div>

                  <h3
                    className={cn(
                      "mt-4 text-2xl font-bold tracking-tight",
                      isPopular ? "text-primary" : "text-foreground",
                    )}
                  >
                    {plan.shortName}
                  </h3>

                  <p className="mt-3 flex flex-wrap items-baseline gap-1">
                    <span
                      className={cn(
                        "text-4xl font-bold tracking-tight tabular-nums",
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
                      <Badge
                        variant="neutral"
                        tone="soft"
                        className="tabular-nums"
                      >
                        {plan.usersBadge}
                      </Badge>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground flex items-center gap-2.5">
                        <CheckCircle className="text-primary h-4 w-4 shrink-0" />
                        {pricing.featureLabels.branches}
                      </span>
                      <Badge
                        variant="neutral"
                        tone="soft"
                        className="tabular-nums"
                      >
                        {plan.branchesBadge}
                      </Badge>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground flex items-center gap-2.5">
                        <CheckCircle className="text-primary h-4 w-4 shrink-0" />
                        {pricing.featureLabels.stamps}
                      </span>
                      <Badge
                        variant="neutral"
                        tone="soft"
                        className="tabular-nums"
                      >
                        {plan.stampsBadge}
                      </Badge>
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
            {pricing.addonsNote}{" "}
            <a
              href={`#${landingCopy.addons.id}`}
              className="text-primary font-medium hover:underline"
            >
              Ver add-ons
            </a>
          </p>
        </LandingReveal>
      </div>
    </section>
  );
};

const AddonsSection = () => {
  const { addons } = landingCopy;
  return (
    <section id={addons.id} className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {addons.title}
          </h2>
          <p className="text-muted-foreground mt-4">{addons.subtitle}</p>
        </LandingReveal>

        <LandingReveal className="mt-12">
          <div className="bg-muted/40 border-border/50 overflow-hidden rounded-3xl border">
            <div className="landing-reveal-stagger grid md:grid-cols-2 lg:grid-cols-4">
              {addons.items.map((item, index) => {
                const Icon = addonIcons[index] ?? Wrench;
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
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <div className="bg-background text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full border">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="neutral" tone="soft">
                        {addons.badge}
                      </Badge>
                    </div>
                    <h3 className="mb-2 font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
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
            {addons.footnote}
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
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <LandingReveal>
          <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-3xl px-6 py-14 text-center shadow-lg md:px-12 md:py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              aria-hidden
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 60% 50% at 100% 0%, color-mix(in oklch, var(--primary-foreground) 18%, transparent), transparent 50%)
                `,
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
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
  const { brand, footer, nav } = landingCopy;
  return (
    <footer className="pb-10 pt-4">
      <div className="container mx-auto px-4">
        <LandingReveal>
          <div className="grid gap-10 border-b pb-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                  <Truck className="text-primary-foreground h-4 w-4" />
                </div>
                <span className="font-semibold">{brand}</span>
              </div>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {footer.tagline}
              </p>
            </div>

            <div>
              <p className="text-foreground mb-3 text-sm font-semibold">
                {footer.product}
              </p>
              <nav className="flex flex-col gap-2" aria-label="Producto">
                <a
                  href={`#${landingCopy.features.id}`}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {nav.features}
                </a>
                <a
                  href={`#${landingCopy.pricing.id}`}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {nav.pricing}
                </a>
                <a
                  href={`#${landingCopy.addons.id}`}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {nav.addons}
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

          <div className="bg-muted/50 mt-6 flex flex-col items-center justify-between gap-3 rounded-full px-5 py-3 text-center sm:flex-row sm:text-left">
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
