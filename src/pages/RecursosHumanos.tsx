import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
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
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';

export default function RecursosHumanos() {
  const { isReadOnly } = useDirectorBranch();
  const [activeTab, setActiveTab] = useState('colaboradores');

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader 
          title="Recursos Humanos" 
          description="Gestão de colaboradores, férias e folha de pagamento"
          icon={<Users className="h-5 w-5" />}
        />

        {/* Tabs Container - Glassmorphism */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-info/20 rounded-xl sm:rounded-2xl blur-xl opacity-50 hidden sm:block" />
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                <TabsTrigger value="colaboradores" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="h-4 w-4" />
                  <span>Colaboradores</span>
                </TabsTrigger>
                <TabsTrigger value="ferias" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Palmtree className="h-4 w-4" />
                  <span>Férias</span>
                </TabsTrigger>
                <TabsTrigger value="afastamentos" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Afastamentos</span>
                </TabsTrigger>
                <TabsTrigger value="folha" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Calculator className="h-4 w-4" />
                  <span>Folha</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colaboradores" className="mt-4 sm:mt-6">
                <EmployeesTab isReadOnly={isReadOnly} />
              </TabsContent>

              <TabsContent value="ferias" className="mt-4 sm:mt-6">
                <VacationsTab isReadOnly={isReadOnly} />
              </TabsContent>

              <TabsContent value="afastamentos" className="mt-4 sm:mt-6">
                <LeavesTab isReadOnly={isReadOnly} />
              </TabsContent>

              <TabsContent value="folha" className="mt-4 sm:mt-6">
                <PayrollsTab isReadOnly={isReadOnly} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
