import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BrandLockup } from "./BrandLockup";

describe("BrandLockup", () => {
  it("keeps mark brand when wordmark is onBrand (bg-primary mixed lockup)", () => {
    const { container } = render(
      <BrandLockup variant="onBrand" markVariant="brand" decorative />,
    );
    const root = container.firstElementChild as HTMLElement;
    const mark = root.querySelector(".text-primary");
    const wordmark = root.querySelector(".text-primary-foreground");
    expect(mark).toBeTruthy();
    expect(wordmark).toBeTruthy();
    expect(wordmark).toHaveTextContent("tlamx");
  });

  it("uses onInk wordmark + brand mark on chrome ink", () => {
    const { container } = render(
      <BrandLockup variant="onInk" decorative />,
    );
    const root = container.firstElementChild as HTMLElement;
    const mark = root.querySelector(".text-primary");
    const wordmark = root.querySelector(".text-palette-brand-on-ink");
    expect(mark).toBeTruthy();
    expect(wordmark).toBeTruthy();
    expect(wordmark).toHaveTextContent("tlamx");
    expect(root.querySelector(".text-primary-foreground")).toBeNull();
    expect(root.querySelector(".text-sidebar-foreground")).toBeNull();
  });

  it("keeps onInk classes under dark + Patio v2 (no primary-foreground on ink)", () => {
    const rootEl = document.documentElement;
    const prevClass = rootEl.className;
    const prevPalette = rootEl.getAttribute("data-palette");
    rootEl.classList.add("dark");
    rootEl.setAttribute("data-palette", "v2");

    try {
      const { container } = render(
        <BrandLockup variant="onInk" markVariant="brand" decorative />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root.querySelector(".text-palette-brand-on-ink")).toBeTruthy();
      expect(root.querySelector(".text-primary")).toBeTruthy();
      expect(root.querySelector(".text-primary-foreground")).toBeNull();
    } finally {
      rootEl.className = prevClass;
      if (prevPalette == null) rootEl.removeAttribute("data-palette");
      else rootEl.setAttribute("data-palette", prevPalette);
    }
  });

  it("uses a full brand lockup when variant is brand", () => {
    const { container } = render(
      <BrandLockup variant="brand" decorative />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.querySelectorAll(".text-primary").length).toBeGreaterThanOrEqual(
      2,
    );
    expect(root.querySelector(".text-primary-foreground")).toBeNull();
    expect(root.querySelector(".text-palette-brand-on-ink")).toBeNull();
  });

  it("keeps mark brand in compact onInk (sidebar collapsed)", () => {
    const { container } = render(
      <BrandLockup
        compact
        variant="onInk"
        markVariant="brand"
        decorative
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.querySelector(".text-primary")).toBeTruthy();
    expect(root.querySelector(".text-primary-foreground")).toBeNull();
    expect(root.querySelector(".text-palette-brand-on-ink")).toBeNull();
    expect(root.textContent).not.toMatch(/tlamx/i);
  });
});
