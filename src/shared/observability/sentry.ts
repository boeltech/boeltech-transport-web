import * as Sentry from "@sentry/react";
import config from "@shared/config/env";
import { scrubSentryEvent } from "./sentry-scrub";

export interface WebExceptionContext {
  componentStack?: string;
  apiPath?: string;
  errorCode?: string;
}

export interface SentryUserContext {
  id: string;
  tenantId: string;
  role: string;
}

let initialized = false;

function parseTracesSampleRate(): number {
  const raw = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE;
  if (!raw) return 0;
  const parsed = Number.parseFloat(String(raw));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0;
}

/**
 * Initializes Sentry in production builds when VITE_SENTRY_DSN is set.
 */
export function initSentry(): boolean {
  if (!config.observability.enabled || !config.observability.sentryDsn) {
    return false;
  }

  if (initialized) {
    return true;
  }

  Sentry.init({
    dsn: config.observability.sentryDsn,
    environment: config.observability.environment,
    release: config.observability.release,
    enabled: true,
    tracesSampleRate: parseTracesSampleRate(),
    beforeSend: scrubSentryEvent,
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });

  initialized = true;
  return true;
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export function captureWebException(
  error: unknown,
  context?: WebExceptionContext,
): void {
  if (!initialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.componentStack) {
      scope.setExtra("componentStack", context.componentStack);
    }
    if (context?.apiPath) {
      scope.setTag("api_path", context.apiPath);
    }
    if (context?.errorCode) {
      scope.setTag("error_code", context.errorCode);
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), "error");
    }
  });
}

export function setSentryUser(user: SentryUserContext): void {
  if (!initialized) {
    return;
  }

  Sentry.setUser({ id: user.id });
  Sentry.setTags({
    tenant_id: user.tenantId,
    role: user.role,
  });
}

export function clearSentryUser(): void {
  if (!initialized) {
    return;
  }

  Sentry.setUser(null);
  Sentry.setTags({
    tenant_id: undefined,
    role: undefined,
  });
}
