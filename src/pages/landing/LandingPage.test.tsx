import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

  it("exposes skip-link, main#contenido and H1 without a hero lockup", () => {
    const { container } = renderLanding();

    expect(
      screen.getByRole("link", { name: landingCopy.skipLink }),
    ).toHaveAttribute("href", "#contenido");
    expect(container.querySelector("main#contenido")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: landingCopy.hero.title }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('a[href="/welcome"]')).toHaveLength(1);
    expect(container.querySelector(".landing-hero-brand-rule")).toBeNull();
  });

  it("keeps header primary CTA and a #pricing anchor", () => {
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
  });

  it("mounts product preview after Qué incluye, not in the hero", () => {
    const { container } = renderLanding();
    const product = container.querySelector("#producto");
    expect(product?.querySelector(".landing-preview-frame")).toBeTruthy();
    expect(
      container.querySelector(".landing-hero .landing-preview-frame"),
    ).toBeNull();
  });

  it("sends open-mode plan CTAs to /register and Grande to quote mailto", () => {
    renderLanding();
    const trialLinks = screen.getAllByRole("link", {
      name: landingCopy.pricing.cta,
    });
    expect(trialLinks.length).toBeGreaterThanOrEqual(3);
    for (const link of trialLinks) {
      expect(link).toHaveAttribute("href", "/register");
    }
    expect(
      screen.getByRole("link", { name: landingCopy.pricing.ctaQuote }),
    ).toHaveAttribute("href", "mailto:ventas@boeltech.com");
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
  });
});
