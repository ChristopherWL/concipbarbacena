import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Search, Building, Plus, Pencil, MapPin, Phone, Mail, UserPlus, Shield, CheckCircle2, Briefcase } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Branch, Tenant } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Director {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface PermissionTemplate {
  id: string;
  name: string;
  tenant_id: string;
}

export function BranchesPanel() {
  const [branches, setBranches] = useState<(Branch & { tenant_name?: string })[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Tenant creation state
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSavingTenant, setIsSavingTenant] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    slug: '',
    cnpj: '',
    razao_social: '',
    email: '',
    phone: '',
    primary_color: '#3b82f6',
    secondary_color: '#f1f5f9',
    menu_color: '#1e3a5f',
  });
  
  // Admin creation state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [selectedBranchForAdmin, setSelectedBranchForAdmin] = useState<(Branch & { tenant_name?: string }) | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', full_name: '', role: 'admin' as 'admin' | 'manager' });
  
  // Director access state
  const [directorDialogOpen, setDirectorDialogOpen] = useState(false);
  const [isCreatingDirector, setIsCreatingDirector] = useState(false);
  const [directorForm, setDirectorForm] = useState({
    tenant_id: '',
    email: '',
    password: '',
    full_name: '',
    role: 'admin' as 'admin' | 'manager',
  });
  
  const [formData, setFormData] = useState({
    tenant_id: '',
    name: '',
    code: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    is_main: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: tenantsData } = await supabase.from('tenants').select('*').order('name');
      setTenants((tenantsData as unknown as Tenant[]) || []);

      const { data: branchesData } = await supabase.from('branches').select('*').order('name');
      const branchesWithTenant = (branchesData || []).map((branch: any) => ({
        ...branch,
        tenant_name: tenantsData?.find((t: any) => t.id === branch.tenant_id)?.name,
      }));
      setBranches(branchesWithTenant);

      const { data: templatesData } = await supabase.from('permission_templates').select('id, name, tenant_id').eq('is_active', true);
      setTemplates((templatesData as PermissionTemplate[]) || []);

      const { data: usersResult } = await supabase.functions.invoke('get-tenant-users');
      const allProfiles = usersResult?.users || [];
      const { data: allRolesData } = await supabase.from('user_roles').select('user_id, role');

      const directorsWithRoles = allProfiles
        .filter((profile: any) => {
          const hasNoBranch = !profile.selected_branch_id;
          const userRoles = allRolesData?.filter((r: any) => r.user_id === profile.id) || [];
          const isAdminOrManager = userRoles.some((r: any) => r.role === 'admin' || r.role === 'manager');
          const isSuperAdmin = userRoles.some((r: any) => r.role === 'superadmin');
          return hasNoBranch && isAdminOrManager && !isSuperAdmin && profile.tenant_id;
        })
        .map((profile: any) => {
          const userRoles = allRolesData?.filter((r: any) => r.user_id === profile.id) || [];
          const role = userRoles.find((r: any) => r.role === 'admin' || r.role === 'manager')?.role || 'admin';
          return { id: profile.id, email: profile.email || '', full_name: profile.full_name || 'Sem nome', role, created_at: profile.created_at || '' };
        });
      setDirectors(directorsWithRoles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleOpenTenantDialog = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setTenantForm({ name: tenant.name || '', slug: tenant.slug || '', cnpj: tenant.cnpj || '', razao_social: tenant.razao_social || '', email: tenant.email || '', phone: tenant.phone || '', primary_color: tenant.primary_color || '#3b82f6', secondary_color: tenant.secondary_color || '#f1f5f9', menu_color: (tenant as any).menu_color || '#1e3a5f' });
    } else {
      setEditingTenant(null);
      setTenantForm({ name: '', slug: '', cnpj: '', razao_social: '', email: '', phone: '', primary_color: '#3b82f6', secondary_color: '#f1f5f9', menu_color: '#1e3a5f' });
    }
    setTenantDialogOpen(true);
  };

  const handleSaveTenant = async () => {
    if (!tenantForm.name) { toast.error('Nome da empresa é obrigatório'); return; }
    const slug = tenantForm.slug || generateSlug(tenantForm.name);
    setIsSavingTenant(true);
    try {
      if (editingTenant) {
        const { error } = await supabase.from('tenants').update({ name: tenantForm.name, slug, cnpj: tenantForm.cnpj, razao_social: tenantForm.razao_social, email: tenantForm.email, phone: tenantForm.phone, primary_color: tenantForm.primary_color, secondary_color: tenantForm.secondary_color, menu_color: tenantForm.menu_color }).eq('id', editingTenant.id);
        if (error) throw error;
        toast.success('Empresa atualizada!');
      } else {
        const { data, error } = await supabase.functions.invoke('create-tenant-admin', { body: { company_name: tenantForm.name, slug, cnpj: tenantForm.cnpj, razao_social: tenantForm.razao_social, email: tenantForm.email, phone: tenantForm.phone, primary_color: tenantForm.primary_color, secondary_color: tenantForm.secondary_color, menu_color: tenantForm.menu_color } });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success('Empresa criada!');
      }
      setTenantDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving tenant:', error);
      toast.error(error.message || 'Erro ao salvar empresa');
    } finally {
      setIsSavingTenant(false);
    }
  };

  const handleOpenDialog = (branch?: Branch, isMain?: boolean) => {
    const defaultTenantId = tenants.length > 0 ? tenants[0].id : '';
    if (branch) {
      setEditingBranch(branch);
      setFormData({ tenant_id: branch.tenant_id, name: branch.name, code: branch.code || '', cnpj: branch.cnpj || '', phone: branch.phone || '', email: branch.email || '', address: branch.address || '', city: branch.city || '', state: branch.state || '', zip_code: branch.zip_code || '', is_main: branch.is_main || false });
    } else {
      setEditingBranch(null);
      setFormData({ tenant_id: defaultTenantId, name: isMain ? 'Matriz' : '', code: '', cnpj: '', phone: '', email: '', address: '', city: '', state: '', zip_code: '', is_main: isMain || false });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.tenant_id || !formData.name) { toast.error('Preencha os campos obrigatórios'); return; }
    setIsSaving(true);
    try {
      if (editingBranch) {
        const { error } = await supabase.from('branches').update(formData).eq('id', editingBranch.id);
        if (error) throw error;
        toast.success('Filial atualizada!');
      } else {
        const { error } = await supabase.from('branches').insert(formData);
        if (error) throw error;
        toast.success('Filial criada!');
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error('Erro ao salvar filial');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBranchStatus = async (branch: Branch) => {
    try {
      const { error } = await supabase.from('branches').update({ is_active: !branch.is_active }).eq('id', branch.id);
      if (error) throw error;
      toast.success(`Filial ${branch.is_active ? 'desativada' : 'ativada'}!`);
      fetchData();
    } catch (error) { toast.error('Erro ao alterar status'); }
  };

  const handleOpenAdminDialog = (branch: Branch & { tenant_name?: string }) => {
    setSelectedBranchForAdmin(branch);
    setAdminForm({ email: '', password: '', full_name: '', role: 'admin' });
    setAdminDialogOpen(true);
  };

  const handleCreateAdmin = async () => {
    if (!selectedBranchForAdmin || !adminForm.email || !adminForm.password || !adminForm.full_name) { toast.error('Preencha todos os campos'); return; }
    if (adminForm.password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    setIsCreatingAdmin(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-tenant-admin', { body: { email: adminForm.email, password: adminForm.password, full_name: adminForm.full_name, role: adminForm.role, tenant_id: selectedBranchForAdmin.tenant_id, branch_id: selectedBranchForAdmin.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Admin criado!');
      setAdminDialogOpen(false);
    } catch (error: any) { toast.error(error.message || 'Erro ao criar admin'); } finally { setIsCreatingAdmin(false); }
  };

  const handleOpenDirectorDialog = () => {
    const defaultTenantId = tenants.length > 0 ? tenants[0].id : '';
    setDirectorForm({ tenant_id: defaultTenantId, email: '', password: '', full_name: '', role: 'admin' });
    setDirectorDialogOpen(true);
  };

  const handleCreateDirector = async () => {
    if (!directorForm.tenant_id || !directorForm.email || !directorForm.password || !directorForm.full_name) { toast.error('Preencha todos os campos'); return; }
    if (directorForm.password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    setIsCreatingDirector(true);
    try {
      const geralTemplate = templates.find(t => t.name.toLowerCase() === 'geral' && t.tenant_id === directorForm.tenant_id);
      const { data, error } = await supabase.functions.invoke('create-tenant-admin', { body: { email: directorForm.email, password: directorForm.password, full_name: directorForm.full_name, tenant_id: directorForm.tenant_id, role: directorForm.role, template_id: geralTemplate?.id || null } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Acesso criado!');
      setDirectorDialogOpen(false);
      fetchData();
    } catch (error: any) { toast.error(error.message || 'Erro ao criar acesso'); } finally { setIsCreatingDirector(false); }
  };

  const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.code?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTenants = tenants.filter(t => t.slug !== 'sistema' && (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.slug.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <>
      <Tabs defaultValue="empresas" className="space-y-4">
        <TabsList className="bg-white/10 border-white/10 h-8">
          <TabsTrigger value="empresas" className="gap-1 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-xs px-2"><Briefcase className="h-3 w-3" />Empresas</TabsTrigger>
          <TabsTrigger value="filiais" className="gap-1 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-xs px-2"><Building className="h-3 w-3" />Filiais</TabsTrigger>
          <TabsTrigger value="diretores" className="gap-1 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 text-xs px-2"><Shield className="h-3 w-3" />Diretores</TabsTrigger>
        </TabsList>

        <TabsContent value="empresas" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" /><Input placeholder="Buscar empresas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm" /></div>
            <Button onClick={() => handleOpenTenantDialog()} size="sm" className="text-xs"><Plus className="h-3 w-3 mr-1" />Nova Empresa</Button>
          </div>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div> : filteredTenants.length === 0 ? <div className="text-center py-8 text-white/50">Nenhuma empresa cadastrada</div> : (
                <Table><TableHeader><TableRow className="border-white/10"><TableHead className="text-white/70">Empresa</TableHead><TableHead className="text-white/70">CNPJ</TableHead><TableHead className="text-white/70">Status</TableHead><TableHead className="text-right text-white/70">Ações</TableHead></TableRow></TableHeader><TableBody>{filteredTenants.map((tenant) => (<TableRow key={tenant.id} className="border-white/10 hover:bg-white/5"><TableCell><div className="flex items-center gap-3"><div className="h-8 w-8 rounded flex items-center justify-center" style={{ backgroundColor: `${tenant.primary_color || '#3b82f6'}30` }}><Briefcase className="h-4 w-4" style={{ color: tenant.primary_color || '#3b82f6' }} /></div><div><p className="font-medium text-white">{tenant.name}</p><p className="text-xs text-white/50">/{tenant.slug}</p></div></div></TableCell><TableCell className="text-white/70">{tenant.cnpj || '-'}</TableCell><TableCell><Badge className={tenant.status === 'active' ? 'bg-green-600' : 'bg-white/10'}>{tenant.status === 'active' ? 'Ativa' : 'Inativa'}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleOpenTenantDialog(tenant)} className="text-white/70 hover:text-white"><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filiais" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" /><Input placeholder="Buscar filiais..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm" /></div>
            <Button onClick={() => handleOpenDialog()} size="sm" className="text-xs"><Plus className="h-3 w-3 mr-1" />Nova Filial</Button>
          </div>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div> : filteredBranches.length === 0 ? <div className="text-center py-8 text-white/50">Nenhuma filial encontrada</div> : (
                <Table><TableHeader><TableRow className="border-white/10"><TableHead className="text-white/70">Filial</TableHead><TableHead className="text-white/70">Cidade</TableHead><TableHead className="text-white/70">Tipo</TableHead><TableHead className="text-white/70">Status</TableHead><TableHead className="text-right text-white/70">Ações</TableHead></TableRow></TableHeader><TableBody>{filteredBranches.map((branch) => (<TableRow key={branch.id} className="border-white/10 hover:bg-white/5"><TableCell><div className="flex items-center gap-3"><div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center"><Building className="h-4 w-4 text-primary" /></div><div><p className="font-medium text-white">{branch.name}</p>{branch.code && <p className="text-xs text-white/50">Código: {branch.code}</p>}</div></div></TableCell><TableCell className="text-white/70">{branch.city && branch.state ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{branch.city}/{branch.state}</span> : '-'}</TableCell><TableCell><Badge variant={branch.is_main ? 'default' : 'outline'} className={branch.is_main ? '' : 'border-white/20 text-white/70'}>{branch.is_main ? 'Matriz' : 'Filial'}</Badge></TableCell><TableCell><Badge className={branch.is_active ? 'bg-green-600' : 'bg-white/10 text-white/50'}>{branch.is_active ? 'Ativa' : 'Inativa'}</Badge></TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => handleOpenAdminDialog(branch)} className="text-white/70 hover:text-white"><UserPlus className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleOpenDialog(branch)} className="text-white/70 hover:text-white"><Pencil className="h-4 w-4" /></Button><Switch checked={branch.is_active} onCheckedChange={() => handleToggleBranchStatus(branch)} /></div></TableCell></TableRow>))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diretores" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" /><Input placeholder="Buscar diretores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm" /></div>
            <Button variant="outline" onClick={handleOpenDirectorDialog} size="sm" className="bg-transparent border-amber-500/50 text-amber-400 hover:bg-amber-500/20 text-xs"><Plus className="h-3 w-3 mr-1" />Novo Diretor</Button>
          </div>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div> : directors.length === 0 ? <div className="text-center py-8 text-white/50">Nenhum diretor cadastrado</div> : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{directors.map((d) => (<Card key={d.id} className="bg-white/5 border-amber-500/30"><CardContent className="p-3"><div className="flex items-center gap-2"><Avatar className="h-8 w-8 border-2 border-amber-500"><AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs">{d.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><h3 className="font-medium text-xs truncate text-white">{d.full_name}</h3><p className="text-[10px] text-white/50 truncate">{d.email}</p></div></div><div className="mt-2 flex items-center justify-between"><Badge className="text-[10px]">{d.role === 'admin' ? 'Administrador' : 'Gerente'}</Badge><Badge variant="outline" className="text-[10px] gap-1 border-amber-500/50 text-amber-400"><CheckCircle2 className="h-2.5 w-2.5" />Geral</Badge></div></CardContent></Card>))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={tenantDialogOpen} onOpenChange={setTenantDialogOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingTenant ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle><DialogDescription>{editingTenant ? 'Atualize os dados' : 'Crie uma nova empresa'}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Nome *</Label><Input value={tenantForm.name} onChange={(e) => setTenantForm(p => ({ ...p, name: e.target.value, slug: p.slug || generateSlug(e.target.value) }))} /></div><div className="space-y-2"><Label>Slug</Label><Input value={tenantForm.slug} onChange={(e) => setTenantForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>CNPJ</Label><Input value={tenantForm.cnpj} onChange={(e) => setTenantForm(p => ({ ...p, cnpj: e.target.value }))} /></div><div className="space-y-2"><Label>Telefone</Label><Input value={tenantForm.phone} onChange={(e) => setTenantForm(p => ({ ...p, phone: e.target.value }))} /></div></div>
            <div className="space-y-2"><Label>E-mail</Label><Input value={tenantForm.email} onChange={(e) => setTenantForm(p => ({ ...p, email: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTenantDialogOpen(false)}>Cancelar</Button><Button onClick={handleSaveTenant} disabled={isSavingTenant}>{isSavingTenant ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTenant ? 'Salvar' : 'Criar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingBranch ? 'Editar Filial' : 'Nova Filial'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Nome *</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} /></div><div className="space-y-2"><Label>Código</Label><Input value={formData.code} onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Cidade</Label><Input value={formData.city} onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))} /></div><div className="space-y-2"><Label>Estado</Label><Input value={formData.state} onChange={(e) => setFormData(p => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))} maxLength={2} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingBranch ? 'Salvar' : 'Criar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Criar Admin da Filial</DialogTitle><DialogDescription>{selectedBranchForAdmin?.name}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={adminForm.role} onValueChange={(v: 'admin' | 'manager') => setAdminForm(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Nome *</Label><Input value={adminForm.full_name} onChange={(e) => setAdminForm(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>E-mail *</Label><Input value={adminForm.email} onChange={(e) => setAdminForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Senha *</Label><Input type="password" value={adminForm.password} onChange={(e) => setAdminForm(p => ({ ...p, password: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateAdmin} disabled={isCreatingAdmin}>{isCreatingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={directorDialogOpen} onOpenChange={setDirectorDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Acesso Diretor</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4"><div className="space-y-2"><Label>Cargo</Label><Select value={directorForm.role} onValueChange={(v: 'admin' | 'manager') => setDirectorForm(p => ({ ...p, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="manager">Gerente</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Nome *</Label><Input value={directorForm.full_name} onChange={(e) => setDirectorForm(p => ({ ...p, full_name: e.target.value }))} /></div><div className="space-y-2"><Label>E-mail *</Label><Input value={directorForm.email} onChange={(e) => setDirectorForm(p => ({ ...p, email: e.target.value }))} /></div><div className="space-y-2"><Label>Senha *</Label><Input type="password" value={directorForm.password} onChange={(e) => setDirectorForm(p => ({ ...p, password: e.target.value }))} /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setDirectorDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateDirector} disabled={isCreatingDirector} className="bg-amber-600 hover:bg-amber-700">{isCreatingDirector ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
