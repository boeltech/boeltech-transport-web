import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { opsCopy } from "../ops/opsCopy";
import {
  PLATFORM_CONSOLE_FAVICON_HREF,
  PLATFORM_CONSOLE_META_DESCRIPTION,
  usePlatformDocumentChrome,
} from "./usePlatformDocumentChrome";

const TENANT_META_DESCRIPTION =
  "tlamx — ERP para empresas de transporte en México. Viajes, flota, CFDI y Carta Porte. Un producto Boeltech.";

describe("usePlatformDocumentChrome", () => {
  let link: HTMLLinkElement;
  let meta: HTMLMetaElement;
  let previousHref: string | null;

  beforeEach(() => {
    document.title = "tlamx";
    document.head
      .querySelectorAll('meta[name="description"]')
      .forEach((node) => node.remove());
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", TENANT_META_DESCRIPTION);
    document.head.appendChild(meta);
    document.head
      .querySelectorAll('link[rel="icon"]')
      .forEach((node) => node.remove());
    link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("type", "image/svg+xml");
    link.setAttribute("href", "/favicon.svg");
    document.head.appendChild(link);
    previousHref = link.getAttribute("href");
  });

  afterEach(() => {
    link.remove();
    meta.remove();
    window.history.pushState({}, "", "/");
  });

  it("names the tab with the Ops wordmark and swaps the favicon", () => {
    const { unmount } = renderHook(() => usePlatformDocumentChrome());

    expect(document.title).toBe(opsCopy.wordmark);
    expect(document.title).not.toBe("tlamx");
    expect(link.getAttribute("href")).toBe(PLATFORM_CONSOLE_FAVICON_HREF);
    expect(meta.getAttribute("content")).toBe(PLATFORM_CONSOLE_META_DESCRIPTION);
    expect(meta.getAttribute("content")).not.toContain("Viajes, flota, CFDI");

    unmount();

    expect(document.title).toBe("tlamx");
    expect(link.getAttribute("href")).toBe(previousHref);
    expect(meta.getAttribute("content")).toBe(TENANT_META_DESCRIPTION);
  });

  it("keeps the console title and favicon when unmounting while still under /platform", () => {
    window.history.pushState({}, "", "/platform");
    const { unmount } = renderHook(() => usePlatformDocumentChrome());

    expect(document.title).toBe(opsCopy.wordmark);
    expect(link.getAttribute("href")).toBe(PLATFORM_CONSOLE_FAVICON_HREF);

    unmount();

    expect(document.title).toBe(opsCopy.wordmark);
    expect(document.title).not.toBe("tlamx");
    expect(link.getAttribute("href")).toBe(PLATFORM_CONSOLE_FAVICON_HREF);
    expect(meta.getAttribute("content")).toBe(PLATFORM_CONSOLE_META_DESCRIPTION);
  });
});
