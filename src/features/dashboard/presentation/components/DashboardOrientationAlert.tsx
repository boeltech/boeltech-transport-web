/**
 * Puente de orientación en Inicio: subtitle + links por rol.
 * Dismiss = localStorage, semántica collapsed = "true". Un key por rol.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { ROLES } from "@shared/constants/roles";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { dashboardCopy } from "../copy/dashboardCopy";

const copy = dashboardCopy.page;

export const DASHBOARD_ORIENTATION_STORAGE_KEY_PREFIX =
  "dashboard.orientation-bridge.";

export function getDashboardOrientationStorageKey(role: string): string {
  return `${DASHBOARD_ORIENTATION_STORAGE_KEY_PREFIX}${role}.collapsed`;
}

type OrientationLink = {
  preface: string;
  href: string;
  label: string;
};

type OrientationContent = {
  title: string;
  links: OrientationLink[];
};

function resolveOrientationContent(
  role: string | undefined,
  canReadTrips: boolean,
): OrientationContent {
  if (role === ROLES.ADMIN) {
    return {
      title: copy.subtitleAdmin,
      links: [
        {
          preface: copy.usersBridge,
          href: "/users",
          label: copy.usersBridgeLink,
        },
        {
          preface: copy.billingBridge,
          href: "/settings/billing",
          label: copy.billingBridgeLink,
        },
      ],
    };
  }

  if (role === ROLES.ACCOUNTANT) {
    return {
      title: copy.subtitleAccountant,
      links: [
        {
          preface: copy.invoiceableBridge,
          href: "/finance/invoiceable",
          label: copy.invoiceableBridgeLink,
        },
      ],
    };
  }

  if (role === ROLES.MANAGER) {
    return {
      title: copy.subtitleManager,
      links: [
        {
          preface: copy.fiscalAttentionBridge,
          href: "/trips?fiscalAttention=1",
          label: copy.fiscalAttentionBridgeLink,
        },
      ],
    };
  }

  if (role === ROLES.OPERATOR) {
    return {
      title: copy.subtitleOperator,
      links: canReadTrips
        ? [
            {
              preface: copy.tripsBridgeOperator,
              href: "/trips",
              label: copy.tripsBridgeOperatorLink,
            },
          ]
        : [],
    };
  }

  if (role === ROLES.CLIENT) {
    const links: OrientationLink[] = [];
    if (canReadTrips) {
      links.push({
        preface: copy.tripsBridgeClient,
        href: "/trips",
        label: copy.tripsBridgeClientLink,
      });
    }
    links.push({
      preface: copy.invoicesBridgeClient,
      href: "/finance/invoices",
      label: copy.invoicesBridgeClientLink,
    });
    return { title: copy.subtitleClient, links };
  }

  if (role === ROLES.DRIVER) {
    return {
      title: copy.subtitleDriver,
      links: canReadTrips
        ? [
            {
              preface: copy.tripsBridgeDriver,
              href: "/trips",
              label: copy.tripsBridgeDriverLink,
            },
          ]
        : [],
    };
  }

  return {
    title: copy.subtitle,
    links: canReadTrips
      ? [
          {
            preface: copy.tripsBridge,
            href: "/trips",
            label: copy.tripsBridgeLink,
          },
        ]
      : [],
  };
}

function readCollapsed(storageKey: string): boolean {
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function writeCollapsed(storageKey: string): void {
  try {
    window.localStorage.setItem(storageKey, "true");
  } catch {
    // ignore quota / private mode
  }
}

export function DashboardOrientationAlert({
  role,
  canReadTrips,
  storageKey,
}: {
  role: string | undefined;
  canReadTrips: boolean;
  storageKey?: string;
}) {
  const resolvedKey =
    storageKey ?? getDashboardOrientationStorageKey(role ?? "staff");
  const [collapsed, setCollapsed] = useState(() => readCollapsed(resolvedKey));

  if (collapsed) return null;

  const content = resolveOrientationContent(role, canReadTrips);

  const dismiss = () => {
    writeCollapsed(resolvedKey);
    setCollapsed(true);
  };

  return (
    <Alert variant="info">
      <Compass className="h-4 w-4" />
      <AlertTitle>{content.title}</AlertTitle>
      <AlertDescription>
        {content.links.length > 0 ? (
          <div className="space-y-1">
            {content.links.map((link) => (
              <p key={link.href}>
                {link.preface}{" "}
                <Link
                  to={link.href}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {link.label}
                </Link>
              </p>
            ))}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
            {copy.orientationDismiss}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
