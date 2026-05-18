import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { useParams } from "react-router-dom";
import {
  User,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  DollarSign,
  FileWarning,
  Info,
  Shield,
} from "lucide-react";
import { DetailPageShell } from "@shared/ui/page-shells";
import { DetailAlertCard, type StatCardProps } from "@shared/ui/data-display";

import { useEmployee } from "../../application/hooks/useEmployees";
import { EMPLOYMENT_TYPE_LABELS } from "../config/employeeConfig";

import {
  EmployeeCompensationTab,
  EmployeeContactTab,
  EmployeeEmploymentTab,
  EmployeePersonalTab,
} from "../components/detail";
import { EmployeeActions } from "../components/EmployeeActions";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { formatMxCurrency } from "../helpers/employeeDetailFormatters";
import {
  daysUntilTermination,
  formatEmployeeTenure,
  isNssMissing,
  shouldHintEventualContract,
} from "../helpers/employeeDetailKpis";

// ============================================================================
// PAGE
// ============================================================================

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ?? "";
  const {
    data: result,
    isLoading,
    isError,
    refetch,
  } = useEmployee(employeeId, !!employeeId);
  const employee = result?.data;

  const refetchEmployee = () => {
    void refetch();
  };

  const [comparisonNowMs, setComparisonNowMs] = useState(() => Date.now());
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setComparisonNowMs(Date.now());
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const employeeStats = useMemo((): StatCardProps[] => {
    if (!employee) return [];

    const isTerm = employee.status === "terminated";
    const nssRegistered = !!employee.nss?.trim();
    const imssLabel = nssRegistered ? "Con registro NSS" : "Sin NSS";
    const imssDescription = nssRegistered
      ? "Declarado en nómina"
      : "Sin número de seguridad social";

    return [
      {
        title: "Antigüedad",
        value: formatEmployeeTenure(
          employee.hireDate,
          employee.terminationDate,
          comparisonNowMs,
        ),
        tone: "primary",
        icon: <CalendarClock className="h-5 w-5" />,
        description: isTerm ? "Hasta fecha de baja" : undefined,
      },
      {
        title: "Salario base",
        value: formatMxCurrency(employee.baseSalary) ?? "—",
        tone: "success",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        title: "Tipo de contrato",
        value: EMPLOYMENT_TYPE_LABELS[employee.employmentType],
        tone: "info",
        icon: <BadgeCheck className="h-5 w-5" />,
      },
      {
        title: "Estatus IMSS",
        value: imssLabel,
        tone: nssRegistered ? "success" : "warning",
        icon: <Shield className="h-5 w-5" />,
        description: imssDescription,
      },
    ];
  }, [employee, comparisonNowMs]);

  const employeeAlerts = useMemo(() => {
    if (!employee) return undefined;

    const terminated = employee.status === "terminated";
    const cards: ReactElement[] = [];

    if (!terminated && isNssMissing(employee)) {
      cards.push(
        <DetailAlertCard
          key="nss-missing"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title="NSS sin registrar"
          items={[
            {
              text: "No hay número de seguridad social capturado. Es obligatorio para nómina e IMSS.",
            },
          ]}
        />,
      );
    }

    const untilTerm = daysUntilTermination(
      employee.terminationDate,
      comparisonNowMs,
    );
    if (!terminated && untilTerm !== null && untilTerm <= 60) {
      cards.push(
        <DetailAlertCard
          key="termination-planned"
          severity="warning"
          icon={<FileWarning className="h-5 w-5" />}
          title="Baja programada próxima"
          items={[
            {
              text: `La fecha de baja registrada es en ${untilTerm} día${untilTerm === 1 ? "" : "s"}. Verifica fechas y documentación.`,
            },
          ]}
        />,
      );
    }

    if (shouldHintEventualContract(employee)) {
      cards.push(
        <DetailAlertCard
          key="eventual-contract"
          severity="info"
          icon={<Info className="h-5 w-5" />}
          title="Contrato eventual"
          items={[
            {
              text: "Controla vigencia y renovaciones según política interna y registro ante IMSS.",
            },
          ]}
        />,
      );
    }

    if (cards.length === 0) return undefined;
    return <div className="space-y-3">{cards}</div>;
  }, [employee, comparisonNowMs]);

  if (isLoading) {
    return (
      <DetailPageShell
        className="mx-auto w-full max-w-6xl p-4 sm:p-6"
        isLoading
        header={{
          backHref: "/employees",
          backLabel: "Volver al listado",
          icon: <User className="h-6 w-6" />,
          iconShape: "circle",
          title: "Empleado",
        }}
      />
    );
  }

  if (isError || !employee) {
    return (
      <DetailPageShell
        className="mx-auto w-full max-w-6xl p-4 sm:p-6"
        isLoading={false}
        notFound
        notFoundConfig={{
          icon: <AlertCircle />,
          title: "Empleado no encontrado",
          description: "El empleado no existe o no está disponible.",
          backHref: "/employees",
          backLabel: "Volver al listado",
        }}
        header={{
          backHref: "/employees",
          icon: <User className="h-6 w-6" />,
          iconShape: "circle",
          title: "Empleado",
        }}
      />
    );
  }

  const isTerminated = employee.status === "terminated";

  return (
    <DetailPageShell
      className="mx-auto w-full max-w-6xl p-4 sm:p-6"
      isLoading={false}
      header={{
        backHref: "/employees",
        backLabel: "Volver al listado",
        icon: <User className="h-6 w-6" />,
        iconVariant: isTerminated ? "muted" : "primary",
        iconShape: "circle",
        title: employee.fullName,
        subtitle: `${employee.employeeNumber}${
          employee.position ? ` · ${employee.position}` : ""
        }${employee.department ? ` · ${employee.department}` : ""}`,
        statusBadge: (
          <EmployeeStatusBadge status={employee.status} showIcon size="sm" />
        ),
        actions: !isTerminated ? (
          <EmployeeActions
            variant="buttons"
            employee={employee}
            onActionComplete={refetchEmployee}
          />
        ) : null,
      }}
      alerts={employeeAlerts}
      stats={employeeStats}
      tabs={{
        defaultValue: "personal",
        items: [
          {
            value: "personal",
            label: "Información",
            content: <EmployeePersonalTab employee={employee} />,
          },
          {
            value: "contact",
            label: "Contacto",
            content: <EmployeeContactTab employee={employee} />,
          },
          {
            value: "employment",
            label: "Laboral",
            content: <EmployeeEmploymentTab employee={employee} />,
          },
          {
            value: "compensation",
            label: "Compensación",
            content: <EmployeeCompensationTab employee={employee} />,
          },
        ],
      }}
      metadata={{
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
        createdBy: employee.createdBy ?? undefined,
      }}
    />
  );
}
