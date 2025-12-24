import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Loader2, Search, Users, Building2, UsersRound, 
  Pencil, Plus, Shield, MapPin, Check, X
} from 'lucide-react';
import { AppRole } from '@/types/database';

interface UserWithAccess {
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
  team_id?: string;
  team_name?: string;
  employee_id?: string;
}

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
  code?: string;
  city?: string;
  state?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  branch_id?: string;
  branch_name?: string;
  leader_employee_id?: string;
  leader_name?: string;
  member_count?: number;
}

interface PermissionTemplate {
  id: string;
  name: string;
  color: string;
  role: string;
}

export function AccessManagementPanel() {
  const { tenant } = useAuthContext();
  const [users, setUsers] = useState<UserWithAccess[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit user dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithAccess | null>(null);
  const [editForm, setEditForm] = useState({
    role: '',
    branch_id: '',
    team_id: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Branch dialog
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({ name: '', code: '', city: '', state: '' });

  // Team dialog
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', color: '#3b82f6', branch_id: '' });

  useEffect(() => {
    fetchData();
  }, [tenant?.id]);

  const fetchData = async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const [usersResult, branchesResult, teamsResult, templatesResult] = await Promise.all([
        supabase.functions.invoke('get-tenant-users'),
        supabase.from('branches').select('*').eq('tenant_id', tenant.id).order('name'),
        supabase.from('teams').select(`
          *,
          leader_employee:employees!teams_leader_employee_id_fkey(name),
          members:team_members(id)
        `).eq('tenant_id', tenant.id).eq('is_active', true).order('name'),
        supabase.from('permission_templates').select('id, name, color, role').eq('tenant_id', tenant.id).eq('is_active', true),
      ]);

      if (usersResult.error) throw usersResult.error;

      const branchesData = (branchesResult.data || []) as Branch[];
      const templatesData = (templatesResult.data || []) as PermissionTemplate[];
      const profilesData = usersResult.data?.users || [];

      setBranches(branchesData);
      setTemplates(templatesData);

      // Process teams with branch names and member count
      const teamsData = (teamsResult.data || []).map((team: any) => ({
        ...team,
        branch_name: branchesData.find(b => b.id === team.branch_id)?.name,
        leader_name: team.leader_employee?.name,
        member_count: team.members?.length || 0,
      }));
      setTeams(teamsData);

      // Get team members to associate users with teams
      const { data: teamMembersData } = await supabase
        .from('team_members')
        .select('team_id, employee_id');

      // Get employees linked to users
      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, user_id, name')
        .eq('tenant_id', tenant.id);

      const employeeByUserId = new Map((employeesData || []).filter(e => e.user_id).map(e => [e.user_id!, e]));
      const teamByEmployeeId = new Map<string, { team_id: string; team_name: string }>();
      
      (teamMembersData || []).forEach((tm: any) => {
        const team = teamsData.find((t: Team) => t.id === tm.team_id);
        if (team && tm.employee_id) {
          teamByEmployeeId.set(tm.employee_id, { team_id: team.id, team_name: team.name });
        }
      });

      const branchMap = new Map(branchesData.map(b => [b.id, b.name]));

      const usersWithAccess: UserWithAccess[] = (profilesData || [])
        .map((profile: any) => {
          const roles = Array.isArray(profile.roles) ? profile.roles : [];
          const templateId = profile.template_id ?? null;
          const template = templatesData.find(t => t.id === templateId);
          const linkedEmployee = employeeByUserId.get(profile.id);
          const teamInfo = linkedEmployee ? teamByEmployeeId.get(linkedEmployee.id) : undefined;

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
            team_id: teamInfo?.team_id,
            team_name: teamInfo?.team_name,
            employee_id: linkedEmployee?.id,
          };
        })
        .filter((user: UserWithAccess) => !user.roles.some((r: any) => r.role === 'superadmin'));

      setUsers(usersWithAccess);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: UserWithAccess) => {
    setSelectedUser(user);
    const role = user.roles[0]?.role || 'user';
    setEditForm({
      role,
      branch_id: user.selected_branch_id || '',
      team_id: user.team_id || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser || !tenant?.id) return;
    setIsSaving(true);
    try {
      // Update branch
      if (editForm.branch_id !== (selectedUser.selected_branch_id || '')) {
        await supabase.from('profiles').update({ 
          selected_branch_id: editForm.branch_id || null 
        }).eq('id', selectedUser.id);
      }

      // Update role
      const currentRole = selectedUser.roles[0]?.role;
      if (editForm.role && editForm.role !== currentRole) {
        await supabase.from('user_roles').update({ 
          role: editForm.role as AppRole 
        }).eq('user_id', selectedUser.id).eq('tenant_id', tenant.id);
      }

      // Update team membership if employee is linked
      if (selectedUser.employee_id) {
        // Remove from current team
        await supabase.from('team_members').delete().eq('employee_id', selectedUser.employee_id);
        
        // Add to new team
        if (editForm.team_id) {
          await supabase.from('team_members').insert({
            team_id: editForm.team_id,
            employee_id: selectedUser.employee_id,
          });
        }
      }

      toast.success('Usuário atualizado!');
      setEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Erro ao atualizar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  // Branch handlers
  const handleOpenBranchDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({ name: branch.name, code: branch.code || '', city: branch.city || '', state: branch.state || '' });
    } else {
      setEditingBranch(null);
      setBranchForm({ name: '', code: '', city: '', state: '' });
    }
    setBranchDialogOpen(true);
  };

  const handleSaveBranch = async () => {
    if (!tenant?.id || !branchForm.name) {
      toast.error('Nome é obrigatório');
      return;
    }
    setIsSaving(true);
    try {
      if (editingBranch) {
        await supabase.from('branches').update(branchForm).eq('id', editingBranch.id);
        toast.success('Filial atualizada!');
      } else {
        await supabase.from('branches').insert({ ...branchForm, tenant_id: tenant.id });
        toast.success('Filial criada!');
      }
      setBranchDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar filial');
    } finally {
      setIsSaving(false);
    }
  };

  // Team handlers
  const handleOpenTeamDialog = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setTeamForm({ name: team.name, description: team.description || '', color: team.color || '#3b82f6', branch_id: team.branch_id || '' });
    } else {
      setEditingTeam(null);
      setTeamForm({ name: '', description: '', color: '#3b82f6', branch_id: '' });
    }
    setTeamDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    if (!tenant?.id || !teamForm.name) {
      toast.error('Nome é obrigatório');
      return;
    }
    setIsSaving(true);
    try {
      if (editingTeam) {
        await supabase.from('teams').update({ 
          name: teamForm.name, 
          description: teamForm.description,
          color: teamForm.color,
          branch_id: teamForm.branch_id || null,
        }).eq('id', editingTeam.id);
        toast.success('Equipe atualizada!');
      } else {
        await supabase.from('teams').insert({ 
          name: teamForm.name, 
          description: teamForm.description,
          color: teamForm.color,
          branch_id: teamForm.branch_id || null,
          tenant_id: tenant.id,
        });
        toast.success('Equipe criada!');
      }
      setTeamDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar equipe');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (role?: string) => {
    const roleConfig: Record<string, { color: string; label: string }> = {
      admin: { color: 'bg-red-600', label: 'Admin' },
      manager: { color: 'bg-blue-500', label: 'Gerente' },
      technician: { color: 'bg-green-500', label: 'Técnico' },
      warehouse: { color: 'bg-amber-500', label: 'Almoxarife' },
      user: { color: 'bg-gray-500', label: 'Usuário' },
    };
    const config = roleConfig[role || 'user'] || { color: 'bg-gray-500', label: 'Usuário' };
    return <Badge className={`${config.color} text-white text-xs`}>{config.label}</Badge>;
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeBranches = branches.filter(b => b.is_active);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-white/10 border-white/10 h-9">
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-sm px-3">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-sm px-3">
            <Building2 className="h-4 w-4" />
            Filiais
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-sm px-3">
            <UsersRound className="h-4 w-4" />
            Equipes
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/70">Usuário</TableHead>
                      <TableHead className="text-white/70">Cargo</TableHead>
                      <TableHead className="text-white/70">Filial</TableHead>
                      <TableHead className="text-white/70">Equipe</TableHead>
                      <TableHead className="text-right text-white/70">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-white/50">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map(user => (
                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="bg-white/10 text-white text-sm">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-white text-sm">{user.full_name || 'Sem nome'}</p>
                                <p className="text-xs text-white/50">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(user.roles[0]?.role)}
                          </TableCell>
                          <TableCell>
                            {user.branch_name ? (
                              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                                <Building2 className="h-3.5 w-3.5" />
                                {user.branch_name}
                              </div>
                            ) : (
                              <span className="text-white/40 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.team_name ? (
                              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                                <UsersRound className="h-3.5 w-3.5" />
                                {user.team_name}
                              </div>
                            ) : (
                              <span className="text-white/40 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenBranchDialog()} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Filial
            </Button>
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/70">Nome</TableHead>
                      <TableHead className="text-white/70">Código</TableHead>
                      <TableHead className="text-white/70">Localização</TableHead>
                      <TableHead className="text-white/70">Status</TableHead>
                      <TableHead className="text-right text-white/70">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-white/50">
                          Nenhuma filial cadastrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      branches.map(branch => (
                        <TableRow key={branch.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span className="font-medium text-white">{branch.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white/70">{branch.code || '—'}</TableCell>
                          <TableCell>
                            {branch.city || branch.state ? (
                              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                                <MapPin className="h-3.5 w-3.5" />
                                {[branch.city, branch.state].filter(Boolean).join(', ')}
                              </div>
                            ) : (
                              <span className="text-white/40">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={branch.is_active ? 'bg-green-600' : 'bg-white/10'}>
                              {branch.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenBranchDialog(branch)}
                              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenTeamDialog()} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Equipe
            </Button>
          </div>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/70">Equipe</TableHead>
                      <TableHead className="text-white/70">Filial</TableHead>
                      <TableHead className="text-white/70">Líder</TableHead>
                      <TableHead className="text-white/70">Membros</TableHead>
                      <TableHead className="text-right text-white/70">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-white/50">
                          Nenhuma equipe cadastrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      teams.map(team => (
                        <TableRow key={team.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-4 w-4 rounded-full" 
                                style={{ backgroundColor: team.color || '#3b82f6' }}
                              />
                              <span className="font-medium text-white">{team.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {team.branch_name ? (
                              <span className="text-white/70">{team.branch_name}</span>
                            ) : (
                              <span className="text-white/40">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {team.leader_name ? (
                              <span className="text-white/70">{team.leader_name}</span>
                            ) : (
                              <span className="text-white/40">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-white/10 text-white/70">
                              {team.member_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenTeamDialog(team)}
                              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Editar Acesso
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Altere o cargo, filial ou equipe do usuário
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback className="bg-white/10 text-white">
                    {getInitials(selectedUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{selectedUser.full_name}</p>
                  <p className="text-sm text-white/50">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-white/70">Cargo (Role)</Label>
                  <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="technician">Técnico</SelectItem>
                      <SelectItem value="warehouse">Almoxarife</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Filial</Label>
                  <Select value={editForm.branch_id} onValueChange={(v) => setEditForm({ ...editForm, branch_id: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione a filial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {activeBranches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Equipe</Label>
                  <Select 
                    value={editForm.team_id} 
                    onValueChange={(v) => setEditForm({ ...editForm, team_id: v })}
                    disabled={!selectedUser.employee_id}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder={selectedUser.employee_id ? "Selecione a equipe" : "Vincule a um colaborador primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedUser.employee_id && (
                    <p className="text-xs text-amber-400">
                      Para atribuir a uma equipe, vincule o usuário a um colaborador primeiro.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {editingBranch ? 'Editar Filial' : 'Nova Filial'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70">Nome *</Label>
              <Input
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Nome da filial"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Código</Label>
              <Input
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Código (ex: 001)"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/70">Cidade</Label>
                <Input
                  value={branchForm.city}
                  onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Estado</Label>
                <Input
                  value={branchForm.state}
                  onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchDialogOpen(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSaveBranch} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-primary" />
              {editingTeam ? 'Editar Equipe' : 'Nova Equipe'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70">Nome *</Label>
              <Input
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Nome da equipe"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Descrição</Label>
              <Input
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Descrição opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/70">Cor</Label>
                <Input
                  type="color"
                  value={teamForm.color}
                  onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })}
                  className="bg-white/5 border-white/10 h-10 p-1 cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Filial</Label>
                <Select value={teamForm.branch_id} onValueChange={(v) => setTeamForm({ ...teamForm, branch_id: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {activeBranches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)} className="border-white/10 text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSaveTeam} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
