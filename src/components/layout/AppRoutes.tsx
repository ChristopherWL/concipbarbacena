import { Suspense, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { useLandscapeBlocker } from "@/hooks/useLandscapeBlocker";
import { routes, isPublicRoute } from "@/routes";

// Fallback component for lazy loading
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

// Landscape blocker overlay
function LandscapeBlocker() {
  return (
    <div className="fixed inset-0 z-[10000] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-2">
        <p className="text-lg font-semibold">Use o celular na vertical</p>
        <p className="text-sm text-muted-foreground">
          Para evitar bugs, gire o aparelho para retrato.
        </p>
      </div>
    </div>
  );
}

export function AppRoutes() {
  const { isLoading } = useAuthContext();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { shouldBlock } = useLandscapeBlocker(isMobile);
  const systemStatus = useSystemStatus();

  const isCurrentRoutePublic = isPublicRoute(location.pathname);

  // Lock portrait orientation on mobile
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
  if (isLoading && !isCurrentRoutePublic) {
    return <PageLoader />;
  }

  return (
    <>
      {shouldBlock && <LandscapeBlocker />}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {routes.map(({ path, element: Element }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}
        </Routes>
      </Suspense>
    </>
  );
}
