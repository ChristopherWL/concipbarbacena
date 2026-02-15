import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Loader2, Search, Plus, Key, Building2, Shield, 
  UserX, UserCheck, Eye, EyeOff, Users, Link2, X, Mail, Pencil, Check
} from 'lucide-react';
import { AppRole } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionTemplatesPanel } from './PermissionTemplatesPanel';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';
import { checkPasswordStrength } from '@/lib/passwordValidation';

interface UserWithDetails {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  is_active: boolean;
  tenant_id?: string;
  selected_branch_id?: string;
  branch_name?: string;
  roles: Array<{ id: string; role: AppRole }>;
  template_id?: string;
  template_name?: string;
  template_color?: string;
  employee_id?: string;
  employee_name?: string;
  created_at: string;
}

interface PermissionTemplate {
  id: string;
  name: string;
  color: string;
  role: string;
}

interface Employee {
  id: string;
  name: string;
  user_id?: string;
  position?: string;
  branch_id?: string;
}

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

export function UserManagementPanel() {
  const { tenant } = useAuthContext();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    template_id: '',
    employee_id: '',
    branch_id: '',
  });

  useEffect(() => {
    fetchData();
  }, [tenant?.id]);

  const fetchData = async () => {
    if (!tenant?.id) return;

    setIsLoading(true);
    try {
      const [usersResult, branchesResult, templatesResult, employeesResult] = await Promise.all([
        supabase.functions.invoke('get-tenant-users'),
        supabase.from('branches').select('id, name, is_active').eq('tenant_id', tenant.id).order('name'),
        supabase.from('permission_templates').select('id, name, color, role').eq('tenant_id', tenant.id).eq('is_active', true),
        supabase.from('employees').select('id, name, user_id, position, branch_id').eq('tenant_id', tenant.id).eq('status', 'ativo').order('name'),
      ]);

      if (usersResult.error) throw usersResult.error;

      const branchesData = (branchesResult.data as Branch[]) || [];
      const templatesData = (templatesResult.data as PermissionTemplate[]) || [];
      const employeesData = (employeesResult.data as Employee[]) || [];
      const profilesData = usersResult.data?.users || [];

      setBranches(branchesData);
      setTemplates(templatesData);
      setEmployees(employeesData);

      // Build branch lookup
      const branchMap = new Map(branchesData.map(b => [b.id, b.name]));
      const employeeByUserId = new Map(employeesData.filter(e => e.user_id).map(e => [e.user_id!, e]));

      const usersWithDetails: UserWithDetails[] = (profilesData || [])
        .map((profile: any) => {
          const roles = Array.isArray(profile.roles) ? profile.roles : [];
          const templateId = profile.template_id ?? null;
          const template = templatesData.find(t => t.id === templateId);
          const linkedEmployee = employeeByUserId.get(profile.id);

          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            avatar_url: profile.avatar_url,
            is_active: profile.is_active ?? true,
            tenant_id: profile.tenant_id,
            selected_branch_id: profile.selected_branch_id,
            branch_name: profile.selected_branch_id ? branchMap.get(profile.selected_branch_id) : undefined,
            roles,
            template_id: templateId || undefined,
            template_name: template?.name,
            template_color: template?.color,
            employee_id: linkedEmployee?.id,
            employee_name: linkedEmployee?.name,
            created_at: profile.created_at,
          };
        })
        .filter((user: UserWithDetails) => !user.roles.some((r: any) => r.role === 'superadmin'));

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!tenant?.id) return;
    if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!newUserData.branch_id) {
      toast.error('Selecione uma filial');
      return;
    }
    
    // Validate password strength
    const passwordStrength = checkPasswordStrength(newUserData.password);
    if (passwordStrength.score < 5) {
      toast.error('A senha não atende todos os requisitos de segurança');
      return;
    }

    setIsSaving(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-tenant-user', {
        body: {
          tenant_id: tenant.id,
          email: newUserData.email,
          password: newUserData.password,
          full_name: newUserData.full_name,
          template_id: newUserData.template_id || null,
          branch_id: newUserData.branch_id,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      if (newUserData.employee_id && result?.userId) {
        await supabase.from('employees').update({ user_id: result.userId }).eq('id', newUserData.employee_id);
      }

      toast.success('Usuário criado com sucesso!');
      setCreateDialogOpen(false);
      setNewUserData({ email: '', password: '', full_name: '', template_id: '', employee_id: '', branch_id: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user: UserWithDetails) => {
    try {
      await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
      toast.success(`Usuário ${user.is_active ? 'desativado' : 'ativado'}!`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleChangeTemplate = async (userId: string, templateId: string) => {
    if (!tenant?.id) return;
    try {
      const selectedTemplate = templateId ? templates.find(t => t.id === templateId) : null;
      await supabase.from('user_permissions').upsert(
        { user_id: userId, tenant_id: tenant.id, template_id: templateId || null },
        { onConflict: 'user_id,tenant_id' }
      );
      if (selectedTemplate) {
        await supabase.from('user_roles').update({ role: selectedTemplate.role as AppRole }).eq('user_id', userId).eq('tenant_id', tenant.id);
      }
      toast.success('Perfil atualizado!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atribuir perfil');
    }
  };

  const handleChangeBranch = async (userId: string, branchId: string) => {
    try {
      await supabase.from('profiles').update({ selected_branch_id: branchId === 'none' ? null : branchId }).eq('id', userId);
      toast.success('Filial alterada!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar filial');
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    
    // Validate password strength
    const passwordStrength = checkPasswordStrength(newPassword);
    if (passwordStrength.score < 5) {
      toast.error('A senha não atende todos os requisitos de segurança');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: { user_id: selectedUser.id, new_password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Senha alterada!');
      setPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkEmployee = async (userId: string, employeeId: string) => {
    try {
      // Clear existing link
      await supabase.from('employees').update({ user_id: null }).eq('user_id', userId);
      
      if (employeeId && employeeId !== 'none') {
        await supabase.from('employees').update({ user_id: userId }).eq('id', employeeId);
      }
      toast.success('Colaborador vinculado!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao vincular colaborador');
    }
  };

  const handleUpdateName = async () => {
    if (!selectedUser || !editedName.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editedName.trim() })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast.success('Nome atualizado!');
      setIsEditingName(false);
      setSelectedUser({ ...selectedUser, full_name: editedName.trim() });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar nome');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranchFilter === 'all' || user.selected_branch_id === selectedBranchFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.is_active : !user.is_active);
    return matchesSearch && matchesBranch && matchesStatus;
  });

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (roles: Array<{ role: AppRole }>) => {
    const role = roles[0]?.role;
    const roleConfig: Record<string, { color: string; label: string }> = {
      admin: { color: 'bg-red-600', label: 'Admin' },
      manager: { color: 'bg-blue-500', label: 'Gerente' },
      technician: { color: 'bg-green-500', label: 'Técnico' },
      warehouse: { color: 'bg-amber-500', label: 'Almoxarife' },
      user: { color: 'bg-gray-500', label: 'Usuário' },
    };
    const config = roleConfig[role] || { color: 'bg-gray-500', label: 'Usuário' };
    return <Badge className={`${config.color} text-white text-[8px] px-1 py-0 h-3 font-medium leading-none`}>{config.label}</Badge>;
  };

  return (
    <Tabs defaultValue="users" className="space-y-3">
      <TabsList className="bg-white/10 border-white/10 h-8">
        <TabsTrigger value="users" className="gap-1 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-xs px-2">
          <Users className="h-3 w-3" />
          <span className="hidden sm:inline">Usuários</span>
        </TabsTrigger>
        <TabsTrigger value="profiles" className="gap-1 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-xs px-2">
          <Shield className="h-3 w-3" />
          <span className="hidden sm:inline">Perfis</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                <SelectTrigger className="w-full sm:w-[160px] bg-white/5 border-white/10 text-white">
                  <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <SelectValue placeholder="Todas filiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas filiais</SelectItem>
                  {branches.filter(b => b.is_active).map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Novo</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-16 text-white/50">
                Nenhum usuário encontrado
              </div>
            ) : (
              filteredUsers.map(user => (
                <Card 
                  key={user.id} 
                  onClick={() => { setSelectedUser(user); setDetailsDialogOpen(true); }}
                  className={`bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group ${!user.is_active ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 mb-3 ring-2 ring-white/10 group-hover:ring-primary/50 transition-all">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-base sm:text-lg bg-white/10 text-white">{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium text-white text-xs sm:text-sm truncate w-full leading-tight">{user.full_name || 'Sem nome'}</div>
                    <div className="text-[10px] sm:text-xs text-white/50 truncate w-full flex items-center justify-center gap-1 mt-1">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {!user.is_active && (
                      <Badge variant="secondary" className="mt-2 text-[10px]">Inativo</Badge>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 text-sm text-white/50 pt-2 border-t border-white/10">
          <span>{filteredUsers.length} usuário(s)</span>
          <span className="text-white/20">•</span>
          <span>{filteredUsers.filter(u => u.is_active).length} ativo(s)</span>
        </div>
      </TabsContent>

      <TabsContent value="profiles">
        <PermissionTemplatesPanel />
      </TabsContent>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={(open) => {
        setDetailsDialogOpen(open);
        if (!open) {
          setIsEditingName(false);
          setEditedName('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUser?.avatar_url} />
                <AvatarFallback className="bg-primary/20 text-primary">{getInitials(selectedUser?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="h-8 text-base font-semibold"
                      placeholder="Nome do usuário"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateName();
                        if (e.key === 'Escape') {
                          setIsEditingName(false);
                          setEditedName('');
                        }
                      }}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 shrink-0"
                      onClick={handleUpdateName}
                      disabled={isSaving || !editedName.trim()}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 shrink-0"
                      onClick={() => { setIsEditingName(false); setEditedName(''); }}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className="truncate">{selectedUser?.full_name || 'Sem nome'}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditedName(selectedUser?.full_name || '');
                        setIsEditingName(true);
                      }}
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                <div className="text-sm font-normal text-muted-foreground">{selectedUser?.email}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                  {selectedUser.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Filial</Label>
                <Select value={selectedUser.selected_branch_id || 'none'} onValueChange={(v) => handleChangeBranch(selectedUser.id, v)}>
                  <SelectTrigger className="w-full">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sem filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem filial</SelectItem>
                    {branches.filter(b => b.is_active).map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Perfil de Permissão</Label>
                <Select value={selectedUser.template_id || 'none'} onValueChange={(v) => handleChangeTemplate(selectedUser.id, v === 'none' ? '' : v)}>
                  <SelectTrigger className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sem perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem perfil</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: template.color }} />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Colaborador Vinculado</Label>
                <Select value={selectedUser.employee_id || 'none'} onValueChange={(v) => handleLinkEmployee(selectedUser.id, v)}>
                  <SelectTrigger className="w-full">
                    <Link2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Não vinculado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não vinculado</SelectItem>
                    {employees.filter(e => !e.user_id || e.user_id === selectedUser.id).map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => { setPasswordDialogOpen(true); setDetailsDialogOpen(false); }}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
                <Button 
                  variant={selectedUser.is_active ? 'destructive' : 'default'}
                  className="flex-1"
                  onClick={() => { handleToggleStatus(selectedUser); setDetailsDialogOpen(false); }}
                >
                  {selectedUser.is_active ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Ativar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>Crie um novo usuário para o sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={newUserData.full_name}
                onChange={(e) => setNewUserData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Senha forte"
              />
              <PasswordStrengthIndicator password={newUserData.password} />
            </div>
            <div className="space-y-2">
              <Label>Filial *</Label>
              <Select value={newUserData.branch_id} onValueChange={(v) => setNewUserData(prev => ({ ...prev, branch_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTrigger>
                <SelectContent>
                  {branches.filter(b => b.is_active).map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Perfil de Permissão</Label>
              <Select value={newUserData.template_id} onValueChange={(v) => setNewUserData(prev => ({ ...prev, template_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: template.color }} />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vincular a Colaborador</Label>
              <Select value={newUserData.employee_id} onValueChange={(v) => setNewUserData(prev => ({ ...prev, employee_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => !e.user_id).map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Definir nova senha para {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Senha forte"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alterar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
