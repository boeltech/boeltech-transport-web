import * as React from "react";
import { cn } from "@shared/lib/utils/cn";
import { OpsSectionRule } from "../patterns/OpsSectionRule";

export const OpsPanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ops-panel", className)}
    data-testid="ops-panel"
    {...props}
  />
));
OpsPanel.displayName = "OpsPanel";

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

interface HeaderParts {
  label: string;
  description: React.ReactNode | null;
  meta: React.ReactNode[];
}

function takeHeaderParts(children: React.ReactNode, parts: HeaderParts) {
  React.Children.forEach(children, (child) => {
    if (child == null || typeof child === "boolean") return;
    if (!React.isValidElement(child)) return;

    if (child.type === OpsPanelTitle) {
      const text = textOf(child.props.children).trim();
      if (text) parts.label = text;
      return;
    }
    if (child.type === OpsPanelDescription) {
      parts.description = child.props.children ?? null;
      return;
    }
    if (
      child.type === React.Fragment ||
      child.type === "div" ||
      child.type === "span"
    ) {
      takeHeaderParts(child.props.children, parts);
      return;
    }
    parts.meta.push(child);
  });
}

/**
 * Cabecera = regla de sección. El título es el rótulo mono;
 * las acciones quedan en la meta. La descripción, si llega, es una caption.
 */
export function OpsPanelHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const parts: HeaderParts = { label: "", description: null, meta: [] };
  takeHeaderParts(children, parts);
  const meta =
    parts.meta.length > 0 ? (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        {parts.meta}
      </span>
    ) : undefined;

  return (
    <div className={cn("ops-panel-header", className)} {...props}>
      <OpsSectionRule label={parts.label} meta={meta} />
      {parts.description != null && parts.description !== "" ? (
        <p className="ops-panel-description">{parts.description}</p>
      ) : null}
    </div>
  );
}

export function OpsPanelTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("ops-panel-title", className)} {...props} />;
}

export function OpsPanelDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("ops-panel-description", className)} {...props} />;
}

export function OpsPanelBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ops-panel-body", className)} {...props} />;
}
