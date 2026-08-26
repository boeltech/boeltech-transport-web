import type { ErrorEvent, EventHint } from "@sentry/core";

const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "cookie",
  "x-api-key",
]);

const SENSITIVE_FIELD_KEYS = new Set([
  "authorization",
  "password",
  "pac_password",
  "pacpassword",
  "refresh_token",
  "access_token",
  "token",
  "csd",
  "private_key",
  "xml",
]);

const SENSITIVE_QUERY_PARAMS = new Set([
  "token",
  "access_token",
  "refresh_token",
  "password",
]);

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELD_KEYS.has(key.toLowerCase())) {
      result[key] = "[Filtered]";
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = scrubObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === "object"
          ? scrubObject(item as Record<string, unknown>)
          : item,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

function scrubUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url, "http://localhost");
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, "[Filtered]");
      }
    }
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

function scrubHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!headers) return headers;
  const scrubbed: Record<string, string> = { ...headers };
  for (const key of Object.keys(scrubbed)) {
    if (SENSITIVE_HEADER_KEYS.has(key.toLowerCase())) {
      scrubbed[key] = "[Filtered]";
    }
  }
  return scrubbed;
}

function scrubCrumbData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const scrubbed = scrubObject(data);
  if (typeof scrubbed.url === "string") {
    scrubbed.url = scrubUrl(scrubbed.url) ?? scrubbed.url;
  }
  return scrubbed;
}

export function scrubSentryEvent(
  event: ErrorEvent,
  _hint?: EventHint,
): ErrorEvent | null {
  void _hint;

  if (event.request) {
    event.request = {
      ...event.request,
      headers: scrubHeaders(event.request.headers),
      cookies: undefined,
      url: scrubUrl(event.request.url),
      data:
        event.request.data && typeof event.request.data === "object"
          ? scrubObject(event.request.data as Record<string, unknown>)
          : event.request.data,
    };
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => {
      if (crumb.data && typeof crumb.data === "object") {
        return {
          ...crumb,
          data: scrubCrumbData(crumb.data as Record<string, unknown>),
        };
      }
      return crumb;
    });
  }

  if (event.extra && typeof event.extra === "object") {
    event.extra = scrubObject(event.extra as Record<string, unknown>);
  }

  return event;
}

export function shouldCaptureApiStatus(status: number | undefined): boolean {
  return status !== undefined && status >= 500;
}

export { scrubUrl, scrubObject, SENSITIVE_FIELD_KEYS };
