import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { DirectorBranchProvider } from "@/contexts/DirectorBranchContext";
import { MatrizBranchProvider } from "@/contexts/MatrizBranchContext";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import LandingPage from "./pages/LandingPage";
import GenericLandingPage from "./pages/GenericLandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SetupInicial from "./pages/SetupInicial";

import Estoque from "./pages/Estoque";
import EstoqueEPI from "./pages/EstoqueEPI";
import EstoqueEPC from "./pages/EstoqueEPC";
import EstoqueFerramentas from "./pages/EstoqueFerramentas";
import EstoqueMateriais from "./pages/EstoqueMateriais";
import EstoqueEquipamentos from "./pages/EstoqueEquipamentos";
import Movimentacao from "./pages/Movimentacao";
import NotasFiscais from "./pages/NotasFiscais";
import EmissaoNotasFiscais from "./pages/EmissaoNotasFiscais";
import Fechamento from "./pages/Fechamento";
import Frota from "./pages/Frota";
import Equipes from "./pages/Equipes";
import OrdensServico from "./pages/OrdensServico";
import Configuracoes from "./pages/Configuracoes";
import Cautelas from "./pages/Cautelas";
import Clientes from "./pages/Clientes";
import Relatorios from "./pages/Relatorios";
import SuperAdmin from "./pages/SuperAdmin";
import Fornecedores from "./pages/Fornecedores";
import RecursosHumanos from "./pages/RecursosHumanos";
import Obras from "./pages/Obras";
import DiarioObras from "./pages/DiarioObras";
import AuditoriaEstoque from "./pages/AuditoriaEstoque";
import RelatorioAtualizacaoObra from "./pages/RelatorioAtualizacaoObra";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Public routes that don't need to wait for auth
const PUBLIC_ROUTES = ["/", "/auth", "/setup"];

function useLandscapeBlocker(isMobile: boolean) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [allowLandscape, setAllowLandscape] = useState(
    document.documentElement.dataset.allowLandscape === "true"
  );

  useEffect(() => {
    if (!isMobile) {
      setIsLandscape(false);
      return;
    }

    const mq = window.matchMedia("(orientation: landscape)");

    const update = () => {
      setIsLandscape(isMobile && mq.matches);
      setAllowLandscape(document.documentElement.dataset.allowLandscape === "true");
    };

    update();

    if ("addEventListener" in mq) {
      mq.addEventListener("change", update);
    } else {
      // @ts-expect-error - Safari legacy
      mq.addListener(update);
    }

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-allow-landscape"],
    });

    return () => {
      observer.disconnect();
      if ("removeEventListener" in mq) {
        mq.removeEventListener("change", update);
      } else {
        // @ts-expect-error - Safari legacy
        mq.removeListener(update);
      }
    };
  }, [isMobile]);

  return { shouldBlock: isLandscape && !allowLandscape };
}

// Global loading component to prevent flash during auth check
function AppRoutes() {
  const { isLoading } = useAuthContext();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { shouldBlock } = useLandscapeBlocker(isMobile);
  const systemStatus = useSystemStatus();

  // Check if current route is public
  const isPublicRoute =
    PUBLIC_ROUTES.includes(location.pathname) ||
    (location.pathname !== "/" &&
      !location.pathname.startsWith("/dashboard") &&
      !location.pathname.startsWith("/estoque") &&
      !location.pathname.startsWith("/frota") &&
      !location.pathname.startsWith("/equipes") &&
      !location.pathname.startsWith("/os") &&
      !location.pathname.startsWith("/clientes") &&
      !location.pathname.startsWith("/obras") &&
      !location.pathname.startsWith("/diario") &&
      !location.pathname.startsWith("/cautelas") &&
      !location.pathname.startsWith("/relatorios") &&
      !location.pathname.startsWith("/configuracoes") &&
      !location.pathname.startsWith("/fornecedores") &&
      !location.pathname.startsWith("/rh") &&
      !location.pathname.startsWith("/superadmin") &&
      !location.pathname.startsWith("/notas") &&
      !location.pathname.startsWith("/emissao") &&
      !location.pathname.startsWith("/fechamento") &&
      !location.pathname.startsWith("/setup"));

  // Keep the app in portrait on mobile; Signature screen will temporarily switch to landscape.
  useEffect(() => {
    const lockPortrait = async () => {
      try {
        if (isMobile && screen.orientation && "lock" in screen.orientation) {
          await (screen.orientation as any).lock("portrait");
        }
      } catch {
        // ignore - not supported / user gesture required
      }
    };

    lockPortrait();
  }, [isMobile]);

  // Show loading while checking system status
  if (systemStatus.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sistema...</p>
        </div>
      </div>
    );
  }

  // Redirect to setup if system needs configuration (no superadmin exists)
  if (systemStatus.needsSetup && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  // If system is configured but user is trying to access setup, redirect to auth
  if (!systemStatus.needsSetup && location.pathname === '/setup') {
    return <Navigate to="/auth" replace />;
  }

  // Show loading only for protected routes while checking auth
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {shouldBlock && (
        <div className="fixed inset-0 z-[10000] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-sm text-center space-y-2">
            <p className="text-lg font-semibold">Use o celular na vertical</p>
            <p className="text-sm text-muted-foreground">
              Para evitar bugs, gire o aparelho para retrato.
            </p>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/setup" element={<SetupInicial />} />
        <Route path="/" element={<GenericLandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/estoque/epi" element={<EstoqueEPI />} />
        <Route path="/estoque/epc" element={<EstoqueEPC />} />
        <Route path="/estoque/ferramentas" element={<EstoqueFerramentas />} />
        <Route path="/estoque/materiais" element={<EstoqueMateriais />} />
        <Route path="/estoque/equipamentos" element={<EstoqueEquipamentos />} />
        <Route path="/estoque/auditoria" element={<AuditoriaEstoque />} />
        <Route path="/estoque/entrada" element={<Movimentacao />} />
        <Route path="/notas-fiscais" element={<NotasFiscais />} />
        <Route path="/emissao-nf" element={<EmissaoNotasFiscais />} />
        <Route path="/fechamento" element={<Fechamento />} />
        <Route path="/frota" element={<Frota />} />
        <Route path="/equipes" element={<Equipes />} />
        <Route path="/os" element={<OrdensServico />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/obras" element={<Obras />} />
        <Route path="/obras/relatorio/:diarioId" element={<RelatorioAtualizacaoObra />} />
        <Route path="/diario-obras" element={<DiarioObras />} />
        <Route path="/cautelas" element={<Cautelas />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/fornecedores" element={<Fornecedores />} />
        <Route path="/rh" element={<RecursosHumanos />} />
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/:slug" element={<LandingPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DirectorBranchProvider>
          <MatrizBranchProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </MatrizBranchProvider>
        </DirectorBranchProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

