import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Palmtree, 
  FileText, 
  Calculator
} from 'lucide-react';
import { EmployeesTab } from '@/components/hr/EmployeesTab';
import { VacationsTab } from '@/components/hr/VacationsTab';
import { LeavesTab } from '@/components/hr/LeavesTab';
import { PayrollsTab } from '@/components/hr/PayrollsTab';

export default function RecursosHumanos() {
  const { isReadOnly } = useDirectorBranch();
  const [activeTab, setActiveTab] = useState('colaboradores');

  return (
    <DashboardLayout>
      <div className="space-y-3 px-2 sm:px-0" data-tour="hr-content">
        <PageHeader 
          title="Recursos Humanos" 
          description="Gestão de colaboradores, férias e folha de pagamento"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 mt-4">
          <TabsList className="grid w-full grid-cols-4 h-auto overflow-visible">
            <TabsTrigger value="colaboradores" className="flex flex-col gap-1 py-2 text-[10px] sm:text-xs">
              <Users className="h-4 w-4" />
              <span>Colaboradores</span>
            </TabsTrigger>
            <TabsTrigger value="ferias" className="flex flex-col gap-1 py-2 text-[10px] sm:text-xs">
              <Palmtree className="h-4 w-4" />
              <span>Férias</span>
            </TabsTrigger>
            <TabsTrigger value="afastamentos" className="flex flex-col gap-1 py-2 text-[10px] sm:text-xs">
              <FileText className="h-4 w-4" />
              <span>Afastamentos</span>
            </TabsTrigger>
            <TabsTrigger value="folha" className="flex flex-col gap-1 py-2 text-[10px] sm:text-xs">
              <Calculator className="h-4 w-4" />
              <span>Folha</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colaboradores" className="mt-2">
            <EmployeesTab isReadOnly={isReadOnly} />
          </TabsContent>

          <TabsContent value="ferias" className="mt-2">
            <VacationsTab isReadOnly={isReadOnly} />
          </TabsContent>

          <TabsContent value="afastamentos" className="mt-2">
            <LeavesTab isReadOnly={isReadOnly} />
          </TabsContent>

          <TabsContent value="folha" className="mt-2">
            <PayrollsTab isReadOnly={isReadOnly} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
