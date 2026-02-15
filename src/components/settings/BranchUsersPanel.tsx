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
import { toast } from 'sonner';
import { 
  Loader2, Search, Plus, Key, Shield, 
  UserX, UserCheck, Eye, EyeOff, Mail, User
} from 'lucide-react';
import { AppRole } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';
import { strongPasswordSchema, checkPasswordStrength } from '@/lib/passwordValidation';

interface UserWithDetails {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  is_active: boolean;
  tenant_id?: string;
  selected_branch_id?: string;
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
}

interface BranchUsersPanelProps {
  branchId: string;
}

export function BranchUsersPanel({ branchId }: BranchUsersPanelProps) {
  const { tenant } = useAuthContext();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
  
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    template_id: '',
    employee_id: '',
  });

  useEffect(() => {
    fetchData();
  }, [tenant?.id, branchId]);

  const fetchData = async () => {
    if (!tenant?.id || !branchId) return;

    setIsLoading(true);
    try {
      // Validate session against server (prevents stale local sessions)
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        await supabase.auth.signOut();
        window.location.href = '/auth';
        return;
      }

      const [usersResult, templatesResult, employeesResult] = await Promise.all([
        supabase.functions.invoke('get-tenant-users'),
        supabase.from('permission_templates').select('id, name, color, role').eq('tenant_id', tenant.id).eq('is_active', true),
        supabase.from('employees').select('id, name, user_id, position').eq('tenant_id', tenant.id).eq('branch_id', branchId).eq('status', 'ativo').order('name'),
      ]);

      // Check for auth errors specifically
      if (usersResult.error) {
        const status = (usersResult.error as any)?.context?.status;
        const body = (usersResult.error as any)?.context?.body;
        if (status === 401 || body?.error === 'Invalid authentication') {
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          await supabase.auth.signOut();
          window.location.href = '/auth';
          return;
        }
        throw usersResult.error;
      }

      const templatesData = (templatesResult.data as PermissionTemplate[]) || [];
      const employeesData = (employeesResult.data as Employee[]) || [];
      const profilesData = usersResult.data?.users || [];

      setTemplates(templatesData);
      setEmployees(employeesData);

      const employeeByUserId = new Map(employeesData.filter(e => e.user_id).map(e => [e.user_id!, e]));

      // Filter users by branch
      const usersWithDetails: UserWithDetails[] = (profilesData || [])
        .filter((profile: any) => profile.selected_branch_id === branchId)
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
      toast.error('Erro ao carregar usuários');
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
    
    // Validate password with strong requirements
    const passwordValidation = strongPasswordSchema.safeParse(newUserData.password);
    if (!passwordValidation.success) {
      toast.error(passwordValidation.error.errors[0].message);
      return;
    }
    
    if (newUserData.password !== newUserData.confirmPassword) {
      toast.error('As senhas não coincidem');
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
          branch_id: branchId,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      if (newUserData.employee_id && result?.userId) {
        await supabase.from('employees').update({ user_id: result.userId }).eq('id', newUserData.employee_id);
      }

      toast.success('Usuário criado com sucesso!');
      setCreateDialogOpen(false);
      setNewUserData({ email: '', password: '', confirmPassword: '', full_name: '', template_id: '', employee_id: '' });
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

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    
    // Validate password with strong requirements
    const passwordValidation = strongPasswordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      toast.error(passwordValidation.error.errors[0].message);
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.is_active : !user.is_active);
    return matchesSearch && matchesStatus;
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
    return <Badge className={`${config.color} text-white text-[10px] px-1.5 py-0.5`}>{config.label}</Badge>;
  };

  const availableEmployees = employees.filter(e => !e.user_id || e.user_id === selectedUser?.id);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[130px]">
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
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum usuário encontrado nesta filial</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <Card 
                key={user.id} 
                onClick={() => { setSelectedUser(user); setDetailsDialogOpen(true); }}
                className={`hover:shadow-md transition-all cursor-pointer group ${!user.is_active ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 mb-3 ring-2 ring-border group-hover:ring-primary transition-all">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-base sm:text-lg bg-muted">{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium text-sm truncate w-full leading-tight">{user.full_name || 'Sem nome'}</div>
                  <div className="text-xs text-muted-foreground truncate w-full flex items-center justify-center gap-1 mt-1">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="mt-2">
                    {user.template_name ? (
                      <Badge style={{ backgroundColor: user.template_color }} className="text-white text-[10px]">
                        {user.template_name}
                      </Badge>
                    ) : (
                      getRoleBadge(user.roles)
                    )}
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
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2 border-t">
        <span>{filteredUsers.length} usuário(s)</span>
        <span>•</span>
        <span>{filteredUsers.filter(u => u.is_active).length} ativo(s)</span>
      </div>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUser?.avatar_url} />
                <AvatarFallback className="bg-primary/20 text-primary">{getInitials(selectedUser?.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <div>{selectedUser?.full_name || 'Sem nome'}</div>
                <div className="text-sm font-normal text-muted-foreground">{selectedUser?.email}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Perfil de Permissões</Label>
                <Select 
                  value={selectedUser.template_id || 'none'} 
                  onValueChange={(val) => handleChangeTemplate(selectedUser.id, val === 'none' ? '' : val)}
                >
                  <SelectTrigger>
                    <Shield className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem perfil</SelectItem>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vincular Colaborador</Label>
                <Select 
                  value={selectedUser.employee_id || 'none'} 
                  onValueChange={(val) => handleLinkEmployee(selectedUser.id, val)}
                >
                  <SelectTrigger>
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Selecione um colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {availableEmployees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => { setPasswordDialogOpen(true); }}
                  className="w-full gap-2"
                >
                  <Key className="h-4 w-4" />
                  Alterar Senha
                </Button>
                <Button 
                  variant={selectedUser.is_active ? "destructive" : "default"}
                  onClick={() => { handleToggleStatus(selectedUser); setDetailsDialogOpen(false); }}
                  className="w-full gap-2"
                >
                  {selectedUser.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  {selectedUser.is_active ? 'Desativar Usuário' : 'Ativar Usuário'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>Crie um novo usuário para esta filial</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input 
                value={newUserData.full_name}
                onChange={(e) => setNewUserData({...newUserData, full_name: e.target.value})}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input 
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  placeholder="Mínimo 8 caracteres"
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
              {newUserData.password && (
                <PasswordStrengthIndicator password={newUserData.password} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha *</Label>
              <Input 
                type={showPassword ? "text" : "password"}
                value={newUserData.confirmPassword}
                onChange={(e) => setNewUserData({...newUserData, confirmPassword: e.target.value})}
                placeholder="Repita a senha"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Permissões</Label>
              <Select value={newUserData.template_id} onValueChange={(val) => setNewUserData({...newUserData, template_id: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vincular Colaborador</Label>
              <Select value={newUserData.employee_id} onValueChange={(val) => setNewUserData({...newUserData, employee_id: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => !e.user_id).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Alterar senha de {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
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
              {newPassword && (
                <PasswordStrengthIndicator password={newPassword} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordDialogOpen(false); setNewPassword(''); setConfirmPassword(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
