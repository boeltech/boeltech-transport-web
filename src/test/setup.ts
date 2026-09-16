import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom may omit scrollIntoView or ship a stub that throws; cmdk / Radix call it on mount.
Element.prototype.scrollIntoView = function scrollIntoView() {};
window.scrollTo = function scrollTo() {};

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "";
  readonly thresholds: readonly number[] = [];
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this,
    );
  }

  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

class MockResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {
    void _callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

// jsdom ships requestSubmit as a stub that throws "Not implemented".
HTMLFormElement.prototype.requestSubmit = function requestSubmit(
  this: HTMLFormElement,
  submitter?: HTMLElement,
) {
  void submitter;
  this.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
};
