import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ClipboardList, Calculator } from "lucide-react";
import { ServiceProvidersTab } from "@/components/service-providers/ServiceProvidersTab";
import { ServiceProviderAssignmentsTab } from "@/components/service-providers/ServiceProviderAssignmentsTab";
import { ServiceProviderPaymentsTab } from "@/components/service-providers/ServiceProviderPaymentsTab";

export default function Prestadores() {
  const [activeTab, setActiveTab] = useState("providers");

  return (
    <>

      <div className="space-y-6">
        <PageHeader
          title="Prestadores de Serviço"
          description="Cadastro, atribuição de OS e controle de pagamentos"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Cadastro</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Atribuições</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="mt-6">
            <ServiceProvidersTab />
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <ServiceProviderAssignmentsTab />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <ServiceProviderPaymentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
