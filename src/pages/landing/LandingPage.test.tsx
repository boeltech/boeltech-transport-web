import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { OPERATIONAL_PLAN_CATALOG } from "@shared/commercial/operationalPlanCatalog";
import LandingPage from "./LandingPage";
import { landingCopy } from "./landingCopy";

const registrationState = { open: true };

vi.mock("@shared/commercial/usePublicSelfServeRegister", () => ({
  usePublicSelfServeRegister: () => ({ open: registrationState.open }),
}));

vi.mock("@shared/commercial/usePublicOperationalPlans", () => ({
  usePublicOperationalPlans: () => ({ plans: OPERATIONAL_PLAN_CATALOG }),
}));

function stubViewportApis() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });

  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor() {}
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
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
    stubViewportApis();
  });

  it("exposes skip-link, main#contenido, H1 and hero-level brand lockup", () => {
    const { container } = renderLanding();

    expect(
      screen.getByRole("link", { name: landingCopy.skipLink }),
    ).toHaveAttribute("href", "#contenido");
    expect(container.querySelector("main#contenido")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: landingCopy.hero.title }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('a[href="/welcome"]')).toHaveLength(1);
    expect(container.querySelector(".landing-hero-brand")).toBeTruthy();
    expect(container.querySelector(".landing-hero-brand-rule")).toBeTruthy();
  });

  it("keeps header primary CTA and a #pricing anchor without Opcionales/FAQ in nav", () => {
    renderLanding();
    const header = screen.getByRole("banner");

    expect(
      within(header).getByRole("link", { name: landingCopy.nav.register }),
    ).toHaveAttribute("href", "/register");
    expect(
      within(header).getByRole("link", { name: landingCopy.nav.login }),
    ).toHaveAttribute("href", "/login");
    expect(
      within(header)
        .getAllByRole("link", { name: landingCopy.nav.pricing })
        .some((link) => link.getAttribute("href") === "#pricing"),
    ).toBe(true);
    expect(
      within(header).getByRole("link", { name: landingCopy.nav.product }),
    ).toHaveAttribute("href", "#evidencia");
    expect(
      within(header).queryByRole("link", { name: "Opcionales" }),
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole("link", { name: landingCopy.faq.title }),
    ).not.toBeInTheDocument();
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
    renderLanding();

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

    await user.click(within(tablist).getByRole("tab", { name: second.title }));
    expect(
      screen.getByRole("heading", { level: 3, name: second.title }),
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: second.title }),
    ).toHaveAttribute("aria-selected", "true");
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
    expect(pequenaCol?.classList.contains("is-fleet-match")).toBe(true);
    expect(microCol?.classList.contains("is-fleet-match")).toBe(false);

    await user.click(screen.getByRole("radio", { name: "1–5" }));
    expect(microCol?.classList.contains("is-fleet-match")).toBe(true);
    expect(pequenaCol?.classList.contains("is-fleet-match")).toBe(false);
    /* Popular badge permanece, pero sin competir con el match activo. */
    expect(pequenaCol?.classList.contains("is-popular")).toBe(true);

    await user.click(screen.getByRole("radio", { name: "101+" }));
    const grandeCol = container.querySelector(
      '.landing-plan-col[data-plan-code="operacion_grande"]',
    );
    expect(grandeCol?.classList.contains("is-fleet-match")).toBe(true);
    expect(pequenaCol?.classList.contains("is-fleet-match")).toBe(false);
    expect(pequenaCol?.classList.contains("is-popular")).toBe(true);

    expect(screen.getByText("$389")).toBeInTheDocument();
    expect(screen.getByText("$319")).toBeInTheDocument();
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
});

describe("LandingPage closed registration", () => {
  beforeEach(() => {
    registrationState.open = false;
    stubViewportApis();
  });

  it("uses one mailto per non-Grande card and keeps Grande as quote", () => {
    renderLanding();
    const header = screen.getByRole("banner");

    expect(
      within(header).getByRole("link", { name: landingCopy.nav.contactSales }),
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
