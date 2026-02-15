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
      staleTime: 30 * 1000, // 30 seconds for fresher data
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Export queryClient for use in mutation invalidations
export { queryClient };

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
