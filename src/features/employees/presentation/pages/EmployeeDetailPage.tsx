import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  User,
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  DollarSign,
  FileWarning,
  Info,
  Shield,
  Truck,
} from "lucide-react";
import { useTabParam } from "@shared/hooks";
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
import { EmployeeDetailHeaderSubtitle } from "../components/EmployeeDetailHeaderSubtitle";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { formatMxCurrency } from "../helpers/employeeDetailFormatters";
import {
  daysUntilTermination,
  formatEmployeeTenure,
  isNssMissing,
  shouldHintEventualContract,
} from "../helpers/employeeDetailKpis";
import { buildEmployeeDriverRoleAlert } from "../helpers/employeeDriverRoleAlert";
import { employeesCopy } from "../copy";

const copy = employeesCopy.detail;

/** Tabs enlazables por `?tab=`. */
const EMPLOYEE_DETAIL_TABS = [
  "personal",
  "contact",
  "employment",
  "compensation",
] as const;

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ?? "";
  const { activeTab, setActiveTab } = useTabParam(
    EMPLOYEE_DETAIL_TABS,
    "personal",
  );
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

    return [
      {
        title: copy.stat.tenure.title,
        value: formatEmployeeTenure(
          employee.hireDate,
          employee.terminationDate,
          comparisonNowMs,
        ),
        tone: "primary",
        icon: <CalendarClock className="h-5 w-5" />,
        description: isTerm
          ? copy.stat.tenure.descriptionUntilTermination
          : undefined,
      },
      {
        title: copy.stat.baseSalary.title,
        value: formatMxCurrency(employee.baseSalary) ?? "—",
        tone: "success",
        icon: <DollarSign className="h-5 w-5" />,
        description: copy.stat.baseSalary.description,
      },
      {
        title: copy.stat.contractType.title,
        value: EMPLOYMENT_TYPE_LABELS[employee.employmentType],
        tone: "info",
        icon: <BadgeCheck className="h-5 w-5" />,
        description: copy.stat.contractType.description,
      },
      {
        title: copy.stat.imss.title,
        value: nssRegistered
          ? copy.stat.imss.withNss
          : copy.stat.imss.withoutNss,
        tone: nssRegistered ? "success" : "warning",
        icon: <Shield className="h-5 w-5" />,
        description: nssRegistered
          ? copy.stat.imss.descriptionWithNss
          : copy.stat.imss.descriptionWithoutNss,
      },
    ];
  }, [employee, comparisonNowMs]);

  const employeeAlerts = useMemo(() => {
    if (!employee) return undefined;

    const terminated = employee.status === "terminated";
    const cards: ReactElement[] = [];
    const driverAlertCopy = copy.alert.driverRole;

    if (!terminated && isNssMissing(employee)) {
      cards.push(
        <DetailAlertCard
          key="nss-missing"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={copy.alert.nssMissing.title}
          items={[{ text: copy.alert.nssMissing.body }]}
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
          title={copy.alert.terminationPlanned.title}
          items={[{ text: copy.alert.terminationPlanned.body(untilTerm) }]}
        />,
      );
    }

    if (shouldHintEventualContract(employee)) {
      cards.push(
        <DetailAlertCard
          key="eventual-contract"
          severity="info"
          icon={<Info className="h-5 w-5" />}
          title={copy.alert.eventualContract.title}
          items={[{ text: copy.alert.eventualContract.body }]}
        />,
      );
    }

    if (!terminated && employee.driverRole) {
      const driverAlert = buildEmployeeDriverRoleAlert(employee.driverRole);
      cards.push(
        <DetailAlertCard
          key="driver-role"
          severity={driverAlert.severity}
          icon={
            driverAlert.severity === "warning" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Truck className="h-5 w-5" />
            )
          }
          title={driverAlert.title}
          items={[
            ...driverAlert.items,
            {
              text: (
                <>
                  {driverAlertCopy.footerPrefix}{" "}
                  <Link
                    to={`/drivers/${employee.driverRole.driverId}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {driverAlertCopy.linkConductores}
                  </Link>
                  {employee.driverRole.activeTripCount > 0 ? (
                    <>
                      {" "}
                      {driverAlertCopy.footerOrTrips}{" "}
                      <Link
                        to="/trips"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {driverAlertCopy.linkViajes}
                      </Link>
                    </>
                  ) : null}
                  .
                </>
              ),
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
        isLoading
        header={{
          backHref: "/employees",
          icon: <User className="h-6 w-6" />,
          title: copy.title.fallback,
        }}
      />
    );
  }

  if (isError || !employee) {
    return (
      <DetailPageShell
        isLoading={false}
        notFound
        notFoundConfig={{
          icon: <User />,
          title: copy.state.notFoundTitle,
          description: copy.state.notFoundDescription,
          backHref: "/employees",
          backLabel: copy.state.backToList,
        }}
        header={{
          backHref: "/employees",
          icon: <User className="h-6 w-6" />,
          title: copy.title.fallback,
        }}
      />
    );
  }

  const isTerminated = employee.status === "terminated";

  return (
    <DetailPageShell
      isLoading={false}
      header={{
        backHref: "/employees",
        icon: <User className="h-6 w-6" />,
        iconVariant: isTerminated ? "muted" : "primary",
        title: employee.fullName,
        subtitle: (
          <EmployeeDetailHeaderSubtitle
            employeeNumber={employee.employeeNumber}
            position={employee.position}
            department={employee.department}
            isTerminated={isTerminated}
          />
        ),
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
        value: activeTab,
        onValueChange: setActiveTab,
        items: [
          {
            value: "personal",
            label: copy.tab.personal,
            content: <EmployeePersonalTab employee={employee} />,
          },
          {
            value: "contact",
            label: copy.tab.contact,
            content: <EmployeeContactTab employee={employee} />,
          },
          {
            value: "employment",
            label: copy.tab.employment,
            content: <EmployeeEmploymentTab employee={employee} />,
          },
          {
            value: "compensation",
            label: copy.tab.compensation,
            content: <EmployeeCompensationTab employee={employee} />,
          },
        ],
      }}
      metadata={{
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
        createdBy:
          employee.createdByName?.trim() ||
          employee.createdBy?.trim() ||
          undefined,
        updatedBy: employee.updatedByName?.trim() || undefined,
      }}
    />
  );
}
