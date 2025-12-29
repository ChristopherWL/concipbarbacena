import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calculator } from "lucide-react";
import { ServiceProvidersTab } from "@/components/service-providers/ServiceProvidersTab";
import { ServiceProviderPaymentsTab } from "@/components/service-providers/ServiceProviderPaymentsTab";

export default function Prestadores() {
  const [activeTab, setActiveTab] = useState("providers");

  return (
    <DashboardLayout>
      <div className="min-h-screen relative">
        {/* Futuristic Background - hidden on mobile for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-info/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto space-y-4 sm:space-y-8 p-3 sm:p-6">
          <PageHeader
            title="Prestadores de Serviço"
            description="Cadastro e controle de pagamentos"
          />

          {/* Tabs Container - Glassmorphism */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-info/20 rounded-xl sm:rounded-2xl blur-xl opacity-50 hidden sm:block" />
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-sm bg-muted/50">
                  <TabsTrigger value="providers" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Cadastro</span>
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Calculator className="h-4 w-4" />
                    <span className="hidden sm:inline">Pagamentos</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="providers" className="mt-6">
                  <ServiceProvidersTab />
                </TabsContent>

                <TabsContent value="payments" className="mt-6">
                  <ServiceProviderPaymentsTab />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
