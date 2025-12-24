import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, UserCog } from 'lucide-react';
import { BranchesTab } from '@/components/admin/BranchesTab';
import { TeamsTab } from '@/components/admin/TeamsTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function Admin() {
  const { isSuperAdmin, isLoading, isInitialized } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !isLoading && !isSuperAdmin()) {
      navigate('/dashboard');
    }
  }, [isInitialized, isLoading, isSuperAdmin, navigate]);

  if (isLoading || !isInitialized) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground">
            Gerencie filiais, equipes e usuários do sistema
          </p>
        </div>

        <Tabs defaultValue="branches" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="branches" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Filiais
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipes
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branches" className="mt-6">
            <BranchesTab />
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <TeamsTab />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
