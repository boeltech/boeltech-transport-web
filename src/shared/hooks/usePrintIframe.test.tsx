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

  it("R-06: declara sandbox allow-same-origin allow-modals (print dialog + srcdoc)", () => {
    const ref = { current: mockContainer };
    const { result } = renderHook(() => usePrintIframe(ref));

    act(() => {
      result.current.triggerPrint("Recibo");
    });

    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("sandbox")).toBe("allow-same-origin allow-modals");
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
    const listeners = new Map<string, Set<EventListener>>();
    Object.defineProperty(iframe, "contentWindow", {
      value: {
        focus: mockFocus,
        print: mockPrint,
        addEventListener: (type: string, listener: EventListener) => {
          if (!listeners.has(type)) listeners.set(type, new Set());
          listeners.get(type)!.add(listener);
        },
        removeEventListener: (type: string, listener: EventListener) => {
          listeners.get(type)?.delete(listener);
        },
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

  it("sets parent document.title during print so Save-as PDF is not the app name", () => {
    const ref = { current: mockContainer };
    const { result } = renderHook(() => usePrintIframe(ref));
    const originalTitle = document.title;
    document.title = "tlamx";

    act(() => {
      result.current.triggerPrint("Recibo-LIQ-202610-0003");
    });

    const iframe = document.querySelector("iframe");
    const mockPrint = vi.fn(() => {
      expect(document.title).toBe("Recibo-LIQ-202610-0003");
    });
    Object.defineProperty(iframe, "contentWindow", {
      value: {
        focus: vi.fn(),
        print: mockPrint,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
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

    expect(mockPrint).toHaveBeenCalled();
    expect(iframe?.srcdoc).toContain("<title>Recibo-LIQ-202610-0003</title>");

    act(() => {
      window.dispatchEvent(new Event("afterprint"));
    });
    expect(document.title).toBe("tlamx");

    document.title = originalTitle;
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
