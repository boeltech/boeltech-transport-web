import { Link } from "react-router-dom";
import {
  Truck,
  Route,
  Users,
  BarChart3,
  FileText,
  Shield,
  ChevronRight,
  CheckCircle,
  Fuel,
  Wrench,
  DollarSign,
  Clock,
} from "lucide-react";
import { Button } from "@shared/ui/button";

/**
 * LandingPage
 *
 * Página de inicio pública del ERP de Transporte.
 * Presenta las características del sistema y dirige al login.
 */
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <ModulesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

// ============================================
// Header
// ============================================
const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Boeltech ERP</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Características
          </a>
          <a
            href="#modules"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Módulos
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/login" className="inline-flex items-center gap-1">
              Acceder al Sistema
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

// ============================================
// Hero Section
// ============================================
const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      {/* Decorative elements */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="container mx-auto px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm">
          <span className="mr-2 flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Sistema de Gestión Empresarial
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Gestiona tu flota de transporte con{" "}
          <span className="text-primary">eficiencia total</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          ERP completo para empresas de transporte. Controla vehículos,
          conductores, viajes, facturación y más desde una sola plataforma.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link to="/login" className="inline-flex items-center gap-2">
              Acceder al Sistema
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#features">Conocer más</a>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          <StatItem value="100+" label="Vehículos gestionados" />
          <StatItem value="50+" label="Conductores activos" />
          <StatItem value="1,000+" label="Viajes mensuales" />
          <StatItem value="99.9%" label="Disponibilidad" />
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-primary md:text-4xl">{value}</div>
    <div className="mt-1 text-sm text-muted-foreground">{label}</div>
  </div>
);

// ============================================
// Features Section
// ============================================
const features = [
  {
    icon: Clock,
    title: "Tiempo Real",
    description:
      "Monitorea el estado de tu flota y operaciones en tiempo real.",
  },
  {
    icon: Shield,
    title: "Seguro",
    description: "Control de acceso por roles y permisos granulares.",
  },
  {
    icon: BarChart3,
    title: "Reportes",
    description: "Informes detallados para toma de decisiones estratégicas.",
  },
  {
    icon: DollarSign,
    title: "Facturación",
    description: "Genera facturas y complementos de pago con timbrado CFDI.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="border-t bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Todo lo que necesitas para tu operación
          </h2>
          <p className="mt-4 text-muted-foreground">
            Herramientas diseñadas específicamente para empresas de transporte.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50">
    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

// ============================================
// Modules Section
// ============================================
const modules = [
  {
    icon: Truck,
    title: "Gestión de Flota",
    description: "Administra vehículos, documentos, seguros y verificaciones.",
    features: [
      "Inventario de vehículos",
      "Control de documentos",
      "Alertas de vencimientos",
    ],
  },
  {
    icon: Users,
    title: "Conductores",
    description: "Gestiona conductores, licencias y asignaciones.",
    features: [
      "Perfiles completos",
      "Historial de viajes",
      "Control de licencias",
    ],
  },
  {
    icon: Route,
    title: "Operaciones",
    description: "Planifica y monitorea viajes de principio a fin.",
    features: ["Programación de viajes", "Seguimiento GPS", "Bitácora digital"],
  },
  {
    icon: Wrench,
    title: "Mantenimiento",
    description: "Programa mantenimientos preventivos y correctivos.",
    features: [
      "Órdenes de trabajo",
      "Historial de servicio",
      "Control de costos",
    ],
  },
  {
    icon: Fuel,
    title: "Combustible",
    description: "Registra y analiza el consumo de combustible.",
    features: [
      "Registro de cargas",
      "Rendimiento por vehículo",
      "Detección de anomalías",
    ],
  },
  {
    icon: FileText,
    title: "Facturación",
    description: "Genera facturas con timbrado CFDI y carta porte.",
    features: [
      "Timbrado automático",
      "Complementos de pago",
      "Portal de clientes",
    ],
  },
];

const ModulesSection = () => {
  return (
    <section id="modules" className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Módulos del Sistema
          </h2>
          <p className="mt-4 text-muted-foreground">
            Un ecosistema completo para gestionar todos los aspectos de tu
            negocio.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ModuleCard = ({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
}) => (
  <div className="rounded-xl border bg-card p-6 transition-all hover:shadow-md">
    <div className="mb-4 flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="mb-4 text-sm text-muted-foreground">{description}</p>
    <ul className="space-y-2">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

// ============================================
// CTA Section
// ============================================
const CTASection = () => {
  return (
    <section className="border-t bg-primary py-20 text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          ¿Listo para optimizar tu operación?
        </h2>
        <p className="mx-auto mt-4 max-w-xl opacity-90">
          Accede al sistema y comienza a gestionar tu flota de manera más
          eficiente.
        </p>
        <div className="mt-8">
          <Button size="lg" variant="secondary" asChild>
            <Link to="/login" className="inline-flex items-center gap-2">
              Iniciar Sesión
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

// ============================================
// Footer
// ============================================
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Boeltech ERP</span>
        </div>

        {/* Copyright */}
        <p className="text-sm text-muted-foreground">
          © {currentYear} Boeltech. Todos los derechos reservados.
        </p>

        {/* Links */}
        <div className="flex gap-4">
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacidad
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Términos
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Soporte
          </a>
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
