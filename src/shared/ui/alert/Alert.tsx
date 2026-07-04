/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

/**
 * Alert variants — Design System (Fase 4)
 *
 * Cada variante semántica usa los tokens *-soft del DS. El icono y borde
 * usan el token solid del mismo namespace para crear refuerzo visual sin
 * ser estridente. Dark mode hereda automáticamente vía las definiciones de
 * tokens en .dark.
 *
 * Reglas:
 *   - NUNCA usar colores Tailwind crudos (bg-green-500/10, text-yellow-700, …).
 *   - Si necesitas un estado nuevo, agrega un token semántico primero en
 *     index.css.
 */
const alertVariants = cva(
  [
    "relative w-full rounded-lg border px-4 py-3 text-sm",
    "[&:has(>svg)]:grid [&:has(>svg)]:grid-cols-[auto_1fr] [&:has(>svg)]:gap-x-3",
    "[&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:row-span-full [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:self-center",
    "[&>svg~*]:col-start-2 [&>svg~*]:min-w-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-background text-foreground border-border [&>svg]:text-foreground",
        destructive:
          "border-destructive/40 bg-destructive-soft text-destructive-soft-foreground [&>svg]:text-destructive",
        success:
          "border-success/40 bg-success-soft text-success-soft-foreground [&>svg]:text-success",
        warning:
          "border-warning/40 bg-warning-soft text-warning-soft-foreground [&>svg]:text-warning",
        info:
          "border-info/40 bg-info-soft text-info-soft-foreground [&>svg]:text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm leading-normal [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// Iconos por variante
const alertIcons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

// Componente Alert con icono integrado
interface AlertWithIconProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  showIcon?: boolean;
}

const AlertWithIcon = React.forwardRef<HTMLDivElement, AlertWithIconProps>(
  (
    {
      className,
      variant = "default",
      title,
      showIcon = true,
      children,
      ...props
    },
    ref,
  ) => {
    const Icon = alertIcons[variant || "default"];

    return (
      <Alert ref={ref} variant={variant} className={className} {...props}>
        {showIcon && <Icon className="h-4 w-4" />}
        <div className="min-w-0 space-y-1">
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription>{children}</AlertDescription>
        </div>
      </Alert>
    );
  },
);
AlertWithIcon.displayName = "AlertWithIcon";

export { Alert, AlertTitle, AlertDescription, AlertWithIcon, alertVariants };
