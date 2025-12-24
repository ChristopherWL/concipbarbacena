import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DirectorBranchProvider } from "@/contexts/DirectorBranchContext";
import { MatrizBranchProvider } from "@/contexts/MatrizBranchContext";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { AppRoutes } from "@/components/layout/AppRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

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
