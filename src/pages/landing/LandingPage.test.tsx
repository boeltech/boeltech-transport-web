import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { OPERATIONAL_PLAN_CATALOG } from "@shared/commercial/operationalPlanCatalog";
import LandingPage from "./LandingPage";
import { landingCopy } from "./landingCopy";
import {
  prefetchCommercialAsset,
  resetLandingPrefetchCacheForTests,
} from "./landingPrefetch";
import { getCommercialAsset } from "@shared/commercial/assets/commercialAssets";

const registrationState = { open: true };
const viewportState = { reducedMotion: true, mobilePricing: false };

type MockIoInstance = {
  callback: IntersectionObserverCallback;
  elements: Element[];
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

const ioInstances: MockIoInstance[] = [];

vi.mock("@shared/commercial/usePublicSelfServeRegister", () => ({
  usePublicSelfServeRegister: () => ({ open: registrationState.open }),
}));

vi.mock("@shared/commercial/usePublicOperationalPlans", () => ({
  usePublicOperationalPlans: () => ({ plans: OPERATIONAL_PLAN_CATALOG }),
}));

function stubViewportApis() {
  ioInstances.length = 0;

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches:
        (query.includes("prefers-reduced-motion") &&
          viewportState.reducedMotion) ||
        (query.includes("max-width: 1023px") && viewportState.mobilePricing),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });

  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    elements: Element[] = [];
    observe = vi.fn((el: Element) => {
      this.elements.push(el);
    });
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      ioInstances.push(this);
    }
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

/** Dispara IOs que observan `[data-landing-hero]` (chrome sticky + StickyMobileCta). */
function triggerHeroIntersection(isIntersecting: boolean) {
  const hero = document.querySelector("[data-landing-hero]");
  expect(hero).toBeTruthy();
  for (const io of ioInstances) {
    if (!io.elements.includes(hero!)) continue;
    act(() => {
      io.callback(
        [
          {
            isIntersecting,
            target: hero!,
          } as IntersectionObserverEntry,
        ],
        io as unknown as IntersectionObserver,
      );
    });
  }
}

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe("LandingPage /welcome polish", () => {
  beforeEach(() => {
    registrationState.open = true;
    viewportState.reducedMotion = true;
    viewportState.mobilePricing = false;
    stubViewportApis();
  });

  it("exposes skip-link, main#contenido, H1 and a single hero chrome lockup", () => {
    const { container } = renderLanding();

    expect(
      screen.getByRole("link", { name: landingCopy.skipLink }),
    ).toHaveAttribute("href", "#contenido");
    expect(container.querySelector("main#contenido")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: landingCopy.hero.title }),
    ).toBeInTheDocument();

    /* Un solo chrome en el hero (sin header elevated legado externo). */
    expect(container.querySelector("header.landing-header")).toBeNull();
    expect(container.querySelectorAll("[data-landing-hero-chrome]")).toHaveLength(
      1,
    );
    const hero = container.querySelector("[data-landing-hero]");
    expect(hero).toBeTruthy();
    expect(hero!.querySelector("[data-landing-hero-chrome]")).toBeTruthy();
    expect(hero!.querySelectorAll('a[href="/welcome"]')).toHaveLength(1);
    expect(container.querySelectorAll('a[href="/welcome"]')).toHaveLength(1);
    /* Copy column starts at H1 — no duplicate lockup above the title. */
    expect(container.querySelector(".landing-hero-brand")).toBeNull();
    expect(container.querySelector(".landing-hero-brand-rule")).toBeNull();
  });

  it("uses hero-mixed lockup on load and elevated sticky chrome past the hero", () => {
    const { container } = renderLanding();
    const chrome = screen.getByRole("banner");
    expect(chrome).toHaveAttribute("data-landing-hero-chrome");
    expect(chrome).toHaveAttribute("data-stuck", "false");
    expect(chrome).not.toHaveClass("is-stuck");
    const heroLockup = container.querySelector(
      '[data-landing-lockup="hero-mixed"]',
    );
    expect(heroLockup).toBeTruthy();
    expect(
      container.querySelector('[data-landing-lockup="brand"]'),
    ).toBeNull();
    /* Foto ink: onInk (palette-brand-on-ink), no onBrand (primary-foreground). */
    expect(heroLockup?.querySelector(".text-palette-brand-on-ink")).toBeTruthy();
    expect(heroLockup?.querySelector(".text-primary-foreground")).toBeNull();

    triggerHeroIntersection(false);

    expect(chrome).toHaveAttribute("data-stuck", "true");
    expect(chrome).toHaveClass("is-stuck");
    const stuckLockup = container.querySelector(
      '[data-landing-lockup="brand"]',
    );
    expect(stuckLockup).toBeTruthy();
    expect(
      container.querySelector('[data-landing-lockup="hero-mixed"]'),
    ).toBeNull();
    expect(stuckLockup?.querySelector(".text-primary-foreground")).toBeNull();
    expect(stuckLockup?.querySelector(".text-palette-brand-on-ink")).toBeNull();
    /* Un solo chrome tras el swap — sin nav duplicado. */
    expect(container.querySelectorAll("[data-landing-hero-chrome]")).toHaveLength(
      1,
    );

    triggerHeroIntersection(true);
    expect(chrome).toHaveAttribute("data-stuck", "false");
    expect(chrome).not.toHaveClass("is-stuck");
    expect(
      container.querySelector('[data-landing-lockup="hero-mixed"]'),
    ).toBeTruthy();
  });

  it("keeps hero chrome CTA and #pricing / #evidencia anchors without Opcionales/FAQ in nav", () => {
    const { container } = renderLanding();
    const chrome = screen.getByRole("banner");
    expect(chrome).toHaveAttribute("data-landing-hero-chrome");
    expect(
      container.querySelector("[data-landing-hero] [data-landing-hero-chrome]"),
    ).toBe(chrome);

    expect(
      within(chrome).getByRole("link", { name: landingCopy.nav.register }),
    ).toHaveAttribute("href", "/register");
    expect(
      within(chrome).getByRole("link", { name: landingCopy.nav.login }),
    ).toHaveAttribute("href", "/login");
    expect(
      within(chrome).getByRole("link", {
        name: landingCopy.nav.pricing,
        hidden: true,
      }),
    ).toHaveAttribute("href", "#pricing");
    expect(
      within(chrome).getByRole("link", {
        name: landingCopy.nav.product,
        hidden: true,
      }),
    ).toHaveAttribute("href", "#evidencia");
    expect(
      within(chrome).queryByRole("link", {
        name: "Opcionales",
        hidden: true,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(chrome).queryByRole("link", {
        name: landingCopy.faq.title,
        hidden: true,
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps scroll-margin on #evidencia and #pricing for in-page anchors", () => {
    const { container } = renderLanding();
    expect(container.querySelector("#evidencia")).toHaveClass("scroll-mt-20");
    expect(container.querySelector("#pricing")).toHaveClass("scroll-mt-20");
  });

  it("orders DOM as Evidencia → Pricing → FAQ → CTA → Optionals", () => {
    const { container } = renderLanding();
    const main = container.querySelector("main#contenido");
    expect(main).toBeTruthy();

    const evidence = main!.querySelector("#evidencia");
    const pricing = main!.querySelector("#pricing");
    const faq = main!.querySelector("#faq");
    const optionals = main!.querySelector("#opcionales");
    const ctaHeading = within(main as HTMLElement).getByRole("heading", {
      level: 2,
      name: landingCopy.cta.title,
    });

    expect(evidence).toBeTruthy();
    expect(pricing).toBeTruthy();
    expect(faq).toBeTruthy();
    expect(optionals).toBeTruthy();
    expect(main!.querySelector("#producto")).toBeNull();

    const position = (el: Element) =>
      Array.from(main!.children).indexOf(el.closest("section")!);

    expect(position(evidence!)).toBeLessThan(position(pricing!));
    expect(position(pricing!)).toBeLessThan(position(faq!));
    expect(position(faq!)).toBeLessThan(
      position(ctaHeading.closest("section")!),
    );
    expect(position(ctaHeading.closest("section")!)).toBeLessThan(
      position(optionals!),
    );

    expect(
      screen.getByRole("link", { name: landingCopy.pricing.optionalsLink }),
    ).toHaveAttribute("href", "#opcionales");

    const footerProduct = screen.getByRole("navigation", { name: "Producto" });
    expect(
      within(footerProduct).getByRole("link", { name: landingCopy.nav.product }),
    ).toHaveAttribute("href", "#evidencia");
    expect(
      within(footerProduct).queryByRole("link", { name: "Opcionales" }),
    ).not.toBeInTheDocument();
  });

  it("mounts product preview near the hero and again in evidence (not a dense product grid)", () => {
    const { container } = renderLanding();
    expect(
      container.querySelector(".landing-hero .landing-preview-frame"),
    ).toBeTruthy();
    expect(
      container.querySelector("#evidencia .landing-preview-frame"),
    ).toBeTruthy();
    expect(container.querySelector(".landing-module-grid")).toBeNull();
  });

  it("renders evidence tabs from product beats and switches copy", async () => {
    const user = userEvent.setup();
    const { container } = renderLanding();

    const tablist = screen.getByRole("tablist", {
      name: landingCopy.evidence.tablistLabel,
    });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(
      landingCopy.product.items.length,
    );

    const first = landingCopy.product.items[0]!;
    const second = landingCopy.product.items[1]!;

    expect(
      screen.getByRole("heading", { level: 3, name: first.title }),
    ).toBeInTheDocument();

    const evidencePreview = container.querySelector(
      "#evidencia .landing-preview-frame img",
    );
    expect(evidencePreview).toHaveAttribute(
      "src",
      expect.stringContaining("product-preview-fleet"),
    );
    expect(
      container.querySelector("#evidencia .landing-preview-crop-stack"),
    ).toBeTruthy();

    await user.click(within(tablist).getByRole("tab", { name: second.title }));
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 3, name: second.title }),
      ).toBeInTheDocument();
    });
    expect(
      within(tablist).getByRole("tab", { name: second.title }),
    ).toHaveAttribute("aria-selected", "true");

    await waitFor(() => {
      const imgs = container.querySelectorAll(
        "#evidencia .landing-preview-frame img",
      );
      expect(
        Array.from(imgs).some((img) =>
          (img.getAttribute("src") ?? "").includes("product-preview-trips"),
        ),
      ).toBe(true);
    });
  });

  it("autoplays evidence beats when the section is in view", async () => {
    viewportState.reducedMotion = true;
    stubViewportApis();
    vi.useFakeTimers();

    try {
      renderLanding();
      const first = landingCopy.product.items[0]!;
      const second = landingCopy.product.items[1]!;

      expect(
        screen.getByRole("heading", { level: 3, name: first.title }),
      ).toBeInTheDocument();
      expect(
        document.querySelector("#evidencia"),
      ).toHaveAttribute("data-landing-evidence-autoplay", "on");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5500);
        await vi.advanceTimersByTimeAsync(280);
      });

      expect(
        screen.getByRole("tab", { name: second.title }),
      ).toHaveAttribute("aria-selected", "true");
      expect(
        screen.getByRole("heading", { level: 3, name: second.title }),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses fade-slide crop transition in evidence (carouselMotion)", async () => {
    viewportState.reducedMotion = true;
    stubViewportApis();
    const user = userEvent.setup();
    const { container } = renderLanding();

    const stack = container.querySelector(
      "#evidencia .landing-preview-crop-stack",
    );
    expect(stack).toHaveClass("is-carousel-slide");

    const second = landingCopy.product.items[1]!;
    await user.click(screen.getByRole("tab", { name: second.title }));

    await waitFor(() => {
      expect(stack?.getAttribute("data-landing-crop-crossfade")).toBe("active");
      const imgs = stack?.querySelectorAll("img") ?? [];
      expect(imgs.length).toBe(2);
      expect(
        Array.from(imgs).some((img) =>
          (img.getAttribute("src") ?? "").includes("product-preview-fleet"),
        ),
      ).toBe(true);
      expect(
        Array.from(imgs).some((img) =>
          (img.getAttribute("src") ?? "").includes("product-preview-trips"),
        ),
      ).toBe(true);
    });
  });

  it("highlights pricing band from fleet selector without changing SoT amounts", async () => {
    const user = userEvent.setup();
    const { container } = renderLanding();

    expect(
      screen.getByRole("radiogroup", {
        name: landingCopy.pricing.fleetSelector.label,
      }),
    ).toBeInTheDocument();

    const microCol = container.querySelector(
      '.landing-plan-col[data-plan-code="operacion_micro"]',
    );
    const pequenaCol = container.querySelector(
      '.landing-plan-col[data-plan-code="operacion_pequena"]',
    );
    const medianaCol = container.querySelector(
      '.landing-plan-col[data-plan-code="operacion_mediana"]',
    );
    const planCta = (col: Element | null) =>
      col?.querySelector(".landing-plan-actions a");

    /* Default 6–30: solo Pequeña = match + CTA ámbar. */
    expect(pequenaCol?.classList.contains("is-fleet-match")).toBe(true);
    expect(microCol?.classList.contains("is-fleet-match")).toBe(false);
    expect(medianaCol?.classList.contains("is-fleet-match")).toBe(false);
    expect(planCta(pequenaCol)?.classList.contains("landing-cta-amber")).toBe(
      true,
    );
    expect(planCta(microCol)?.classList.contains("landing-cta-amber")).toBe(
      false,
    );
    expect(planCta(medianaCol)?.classList.contains("landing-cta-amber")).toBe(
      false,
    );

    await user.click(screen.getByRole("radio", { name: "1–5" }));
    expect(microCol?.classList.contains("is-fleet-match")).toBe(true);
    expect(pequenaCol?.classList.contains("is-fleet-match")).toBe(false);
    /* Popular badge permanece; no inventa segunda columna featured con CTA ámbar. */
    expect(pequenaCol?.classList.contains("is-popular")).toBe(true);
    expect(planCta(microCol)?.classList.contains("landing-cta-amber")).toBe(
      true,
    );
    expect(planCta(pequenaCol)?.classList.contains("landing-cta-amber")).toBe(
      false,
    );

    await user.click(screen.getByRole("radio", { name: "101+" }));
    const grandeCol = container.querySelector(
      '.landing-plan-col[data-plan-code="operacion_grande"]',
    );
    expect(grandeCol?.classList.contains("is-fleet-match")).toBe(true);
    expect(pequenaCol?.classList.contains("is-fleet-match")).toBe(false);
    expect(pequenaCol?.classList.contains("is-popular")).toBe(true);
    /* Grande cotización: outline/quote, sin CTA ámbar aunque sea match. */
    expect(planCta(grandeCol)?.classList.contains("landing-cta-amber")).toBe(
      false,
    );
    expect(planCta(grandeCol)?.classList.contains("landing-btn-outline-ink")).toBe(
      true,
    );
    expect(planCta(pequenaCol)?.classList.contains("landing-cta-amber")).toBe(
      false,
    );

    expect(screen.getByText("$389")).toBeInTheDocument();
    expect(screen.getByText("$319")).toBeInTheDocument();
  });

  it("F2: pricing band muted (concrete) + tab-style fleet selector", async () => {
    const user = userEvent.setup();
    const { container } = renderLanding();

    const pricing = container.querySelector("#pricing");
    expect(pricing).toHaveClass("landing-band-muted");
    expect(pricing).toHaveClass("landing-pricing");
    expect(pricing).not.toHaveClass("landing-band-surface");

    const selected = screen.getByRole("radio", { name: "6–30" });
    expect(selected).toHaveAttribute("aria-checked", "true");
    expect(selected).toHaveClass("is-selected");
    expect(selected).toHaveClass("landing-fleet-selector-option");

    await user.click(screen.getByRole("radio", { name: "31–100" }));
    expect(screen.getByRole("radio", { name: "31–100" })).toHaveClass(
      "is-selected",
    );
    expect(selected).not.toHaveClass("is-selected");
  });

  it("F3: single section footnote; no brand · plan.name under columns", () => {
    const { container } = renderLanding();
    const pricing = container.querySelector("#pricing");
    expect(pricing).toBeTruthy();

    expect(pricing!.querySelectorAll(".landing-plan-footnote")).toHaveLength(0);
    const footnotes = pricing!.querySelectorAll(".landing-pricing-footnote");
    expect(footnotes).toHaveLength(1);

    const footnote = footnotes[0]!;
    expect(footnote.textContent).toMatch(/ventas/i);
    expect(footnote.textContent).toMatch(/opcionales/i);
    expect(
      within(footnote as HTMLElement).getByRole("link", {
        name: landingCopy.pricing.optionalsLink,
      }),
    ).toHaveAttribute("href", "#opcionales");

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: landingCopy.pricing.title,
      }),
    ).toBeInTheDocument();
  });

  it("F2 D7: scrolls fleet-match into view on mobile when flota changes", async () => {
    viewportState.mobilePricing = true;
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const user = userEvent.setup();
    renderLanding();

    expect(scrollIntoView).not.toHaveBeenCalled();

    await user.click(screen.getByRole("radio", { name: "1–5" }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
    });
  });

  it("renders accessible FAQ with opcionales deep link", async () => {
    const user = userEvent.setup();
    renderLanding();

    const faq = document.querySelector("#faq");
    expect(faq).toBeTruthy();
    expect(
      within(faq as HTMLElement).getByRole("heading", {
        level: 2,
        name: landingCopy.faq.title,
      }),
    ).toBeInTheDocument();

    const first = landingCopy.faq.items[0]!;
    const optionalsItem = landingCopy.faq.items.find((item) =>
      item.question.toLowerCase().includes("combustible"),
    )!;
    const firstTrigger = within(faq as HTMLElement).getByRole("button", {
      name: first.question,
    });
    expect(firstTrigger).toHaveAttribute("aria-expanded", "true");

    await user.click(
      within(faq as HTMLElement).getByRole("button", {
        name: optionalsItem.question,
      }),
    );
    expect(
      within(faq as HTMLElement).getByRole("button", {
        name: optionalsItem.question,
      }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(firstTrigger).toHaveAttribute("aria-expanded", "false");

    expect(
      within(faq as HTMLElement).getByRole("link", {
        name: "Ver opcionales",
      }),
    ).toHaveAttribute("href", "#opcionales");
  });

  it("mounts sticky mobile CTA region (hidden until past hero)", () => {
    const { container } = renderLanding();
    const sticky = container.querySelector("[data-landing-sticky-cta]");
    expect(sticky).toBeTruthy();
    expect(sticky).not.toHaveClass("is-visible");
    expect(
      within(sticky as HTMLElement).getByRole("link", {
        name: landingCopy.nav.register,
        hidden: true,
      }),
    ).toHaveAttribute("href", "/register");
    expect(
      within(sticky as HTMLElement).getByRole("link", {
        name: landingCopy.stickyCta.pricingLink,
        hidden: true,
      }),
    ).toHaveAttribute("href", "#pricing");

    triggerHeroIntersection(false);
    expect(sticky).toHaveClass("is-visible");
    triggerHeroIntersection(true);
    expect(sticky).not.toHaveClass("is-visible");
  });

  it("applies Señal de patio root scope and typographic plan table", () => {
    const { container } = renderLanding();
    expect(container.querySelector(".landing-root")).toBeTruthy();
    expect(container.querySelector(".landing-plan-table")).toBeTruthy();
    expect(container.querySelector(".landing-plan-col.is-popular")).toBeTruthy();
    expect(container.querySelector(".landing-cta-band")).toBeTruthy();
    // Brand = Teal Operate (ERP --palette-brand), not blueprint blue
    expect(container.innerHTML).toContain("var(--landing-brand)");
    expect(container.innerHTML).not.toContain("var(--landing-blueprint)");
    const heroPhoto = container.querySelector(
      "img.landing-hero-photo",
    ) as HTMLImageElement | null;
    expect(heroPhoto).toBeTruthy();
    expect(heroPhoto?.getAttribute("src")).toContain(
      "tlama-landing-hero-yard",
    );
    expect(container.querySelector(".landing-hero-scrim")).toBeTruthy();
    // F2: sin banda sólida primary como fondo completo del hero
    expect(container.querySelector(".landing-hero-band")).toBeNull();
  });

  it("unifies open-mode trial CTA to Probar gratis (header, hero, pricing, close)", () => {
    renderLanding();
    const trialLinks = screen.getAllByRole("link", {
      name: "Probar gratis",
    });
    expect(trialLinks.length).toBeGreaterThanOrEqual(5);
    for (const link of trialLinks) {
      expect(link).toHaveAttribute("href", "/register");
    }
    expect(
      screen.getByRole("link", { name: landingCopy.pricing.ctaQuote }),
    ).toHaveAttribute("href", "mailto:ventas@boeltech.com");
    expect(
      screen.queryByRole("link", { name: "Crear cuenta — es gratis" }),
    ).not.toBeInTheDocument();
  });

  it("shows a single En preparación legend on optionals, not per-cell badges", () => {
    const { container } = renderLanding();
    const optionals = container.querySelector("#opcionales");
    expect(optionals).toBeTruthy();
    expect(
      within(optionals as HTMLElement).getByText(landingCopy.optionals.badge),
    ).toBeInTheDocument();
    expect(
      within(optionals as HTMLElement).getByRole("heading", {
        level: 2,
        name: landingCopy.optionals.title,
      }),
    ).toBeInTheDocument();
    expect(optionals!.textContent).not.toMatch(/\b0[123]\b/);
  });

  it("limits LandingReveal to at most three uses", () => {
    const { container } = renderLanding();
    expect(container.querySelectorAll(".landing-reveal")).toHaveLength(3);
    expect(container.querySelector(".landing-reveal.is-eager")).toBeTruthy();
  });

  it("prefetches the next evidence crop on mount and on tab hover", async () => {
    resetLandingPrefetchCacheForTests();
    const srcAssignments: string[] = [];
    class PrefetchImage {
      decoding = "";
      set src(value: string) {
        srcAssignments.push(value);
      }
      get src() {
        return srcAssignments[srcAssignments.length - 1] ?? "";
      }
    }
    vi.stubGlobal("Image", PrefetchImage);

    const user = userEvent.setup();
    renderLanding();

    const second = landingCopy.product.items[1]!;
    const third = landingCopy.product.items[2]!;
    await waitFor(() => {
      expect(srcAssignments).toContain(
        getCommercialAsset(second.previewAssetId).src,
      );
    });

    await user.hover(
      screen.getByRole("tab", { name: third.title }),
    );
    await waitFor(() => {
      expect(srcAssignments).toContain(
        getCommercialAsset(third.previewAssetId).src,
      );
    });

    const beforeDup = srcAssignments.length;
    prefetchCommercialAsset(second.previewAssetId);
    expect(srcAssignments.length).toBe(beforeDup);
  });
});

describe("LandingPage closed registration", () => {
  beforeEach(() => {
    registrationState.open = false;
    viewportState.reducedMotion = true;
    stubViewportApis();
  });

  it("uses one mailto per non-Grande card and keeps Grande as quote", () => {
    renderLanding();
    const chrome = screen.getByRole("banner");

    expect(
      within(chrome).getByRole("link", {
        name: landingCopy.nav.contactSales,
      }),
    ).toHaveAttribute("href", "mailto:ventas@boeltech.com");
    expect(
      screen.getByRole("link", { name: landingCopy.pricing.ctaQuote }),
    ).toHaveAttribute("href", "mailto:ventas@boeltech.com");
    expect(
      screen.queryByRole("link", { name: landingCopy.pricing.cta }),
    ).not.toBeInTheDocument();

    const salesTalk = screen.getAllByRole("link", {
      name: landingCopy.cta.closedPrimary,
    });
    expect(salesTalk).toHaveLength(1);

    const sticky = document.querySelector("[data-landing-sticky-cta]");
    expect(
      within(sticky as HTMLElement).getByRole("link", {
        name: landingCopy.nav.contactSales,
        hidden: true,
      }),
    ).toHaveAttribute("href", "mailto:ventas@boeltech.com");
  });
});
