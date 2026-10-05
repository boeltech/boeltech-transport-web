import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePrintIframe } from "./usePrintIframe";

describe("usePrintIframe", () => {
  let mockContainer: HTMLDivElement;
  let printSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockContainer = document.createElement("div");
    mockContainer.innerHTML = "<p>Contenido a imprimir</p>";
    document.body.appendChild(mockContainer);
    printSpy = vi.fn();
    window.print = printSpy;
  });

  afterEach(() => {
    vi.useRealTimers();
    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
    // Clean any remaining iframes
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((ifr) => ifr.remove());
  });

  it("calls window.print fallback when contentRef.current is null", () => {
    const ref = { current: null };
    const { result } = renderHook(() => usePrintIframe(ref));

    act(() => {
      result.current.triggerPrint("Test");
    });

    expect(printSpy).toHaveBeenCalled();
  });

  it("creates an invisible iframe and populates srcdoc with sanitized title and content", () => {
    const ref = { current: mockContainer };
    const { result } = renderHook(() => usePrintIframe(ref));

    act(() => {
      result.current.triggerPrint("Empresa & Co <script>");
    });

    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.style.visibility).toBe("hidden");
    expect(iframe?.srcdoc).toContain("<title>Empresa &amp; Co &lt;script&gt;</title>");
    expect(iframe?.srcdoc).toContain("Contenido a imprimir");
  });

  it("handles iframe onload and triggers print on contentWindow", () => {
    const ref = { current: mockContainer };
    const { result } = renderHook(() => usePrintIframe(ref));

    act(() => {
      result.current.triggerPrint("Recibo");
    });

    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();

    const mockFocus = vi.fn();
    const mockPrint = vi.fn();
    Object.defineProperty(iframe, "contentWindow", {
      value: {
        focus: mockFocus,
        print: mockPrint,
      },
      writable: true,
      configurable: true,
    });

    act(() => {
      if (iframe?.onload) {
        (iframe.onload as (e: Event) => void)(new Event("load"));
      }
      vi.advanceTimersByTime(150);
    });

    expect(mockFocus).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
    expect(result.current.isPrinting).toBe(false);
  });

  it("cleans up iframe on unmount", () => {
    const ref = { current: mockContainer };
    const { result, unmount } = renderHook(() => usePrintIframe(ref));

    act(() => {
      result.current.triggerPrint("Test");
    });

    expect(document.querySelector("iframe")).not.toBeNull();

    unmount();

    expect(document.querySelector("iframe")).toBeNull();
  });
});
