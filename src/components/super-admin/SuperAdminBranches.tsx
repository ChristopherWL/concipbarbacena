import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Search, Building2, Plus, Pencil, Trash2, MapPin, Users } from 'lucide-react';

interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  is_main: boolean | null;
  is_active: boolean | null;
  user_count?: number;
}

interface BranchFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  is_main: boolean;
}

const initialFormData: BranchFormData = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  is_main: false,
};

export function SuperAdminBranches() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(initialFormData);

  // Fetch branches with user count
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['superadmin-branches'],
    queryFn: async (): Promise<Branch[]> => {
      // Fetch all branches
      const { data: branchesData, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (error) throw error;

      // Fetch user counts per branch
      const { data: profiles } = await supabase
        .from('profiles')
        .select('branch_id');

      // Count users per branch
      const branchUserCounts: Record<string, number> = {};
      profiles?.forEach((profile) => {
        if (profile.branch_id) {
          branchUserCounts[profile.branch_id] = (branchUserCounts[profile.branch_id] || 0) + 1;
        }
      });

      return (branchesData || []).map((branch) => ({
        ...branch,
        user_count: branchUserCounts[branch.id] || 0,
      }));
    },
  });

  // Get default tenant_id (first tenant in system)
  const { data: defaultTenantId } = useQuery({
    queryKey: ['default-tenant'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('id').limit(1).single();
      return data?.id || null;
    },
  });

  // Create branch mutation
  const createMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      if (!defaultTenantId) throw new Error('Nenhum tenant encontrado');
      
      const { error } = await supabase.from('branches').insert({
        tenant_id: defaultTenantId,
        name: data.name,
        code: data.code || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        is_main: data.is_main,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Filial criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
      setDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar filial');
    },
  });

  // Update branch mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BranchFormData }) => {
      const { error } = await supabase
        .from('branches')
        .update({
          name: data.name,
          code: data.code || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          is_main: data.is_main,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Filial atualizada!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-branches'] });
      setDialogOpen(false);
      setEditingBranch(null);
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar filial');
    },
  });

  // Delete branch mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Filial excluída!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir filial');
    },
  });

  // Toggle branch status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('branches')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao alterar status');
    },
  });

  const handleOpenDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        code: branch.code || '',
        address: branch.address || '',
        city: branch.city || '',
        state: branch.state || '',
        is_main: branch.is_main || false,
      });
    } else {
      setEditingBranch(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Buscar filiais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Filial
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              {searchTerm ? 'Nenhuma filial encontrada' : 'Nenhuma filial cadastrada'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/70">Filial</TableHead>
                    <TableHead className="text-white/70">Código</TableHead>
                    <TableHead className="text-white/70">Localização</TableHead>
                    <TableHead className="text-white/70 text-center">Usuários</TableHead>
                    <TableHead className="text-white/70">Status</TableHead>
                    <TableHead className="text-right text-white/70">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => (
                    <TableRow key={branch.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{branch.name}</p>
                            {branch.is_main && (
                              <Badge variant="secondary" className="mt-0.5 text-xs">
                                Matriz
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/70">
                        {branch.code || '-'}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {branch.city && branch.state ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {branch.city}/{branch.state}
                          </span>
                        ) : branch.address ? (
                          <span className="truncate max-w-[150px]">{branch.address}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-white/50" />
                          <span className="text-white/70">{branch.user_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            branch.is_active
                              ? 'bg-green-600 hover:bg-green-600'
                              : 'bg-white/10 text-white/50'
                          }
                        >
                          {branch.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(branch)}
                            className="text-white/70 hover:text-white h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={branch.is_active ?? true}
                            onCheckedChange={(checked) =>
                              toggleStatusMutation.mutate({ id: branch.id, is_active: checked })
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                                disabled={branch.user_count > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir filial?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. A filial "{branch.name}" será
                                  permanentemente removida.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(branch.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Editar Filial' : 'Nova Filial'}</DialogTitle>
            <DialogDescription>
              {editingBranch
                ? 'Atualize os dados da filial'
                : 'Preencha os dados para criar uma nova filial'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Filial Centro"
                />
              </div>
              <div className="space-y-2">
                <Label>Código Identificador</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="Ex: MG-01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Ex: Belo Horizonte"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))
                  }
                  placeholder="Ex: MG"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Matriz</Label>
                <p className="text-xs text-muted-foreground">Marque se esta é a filial principal</p>
              </div>
              <Switch
                checked={formData.is_main}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_main: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingBranch ? (
                'Salvar'
              ) : (
                'Criar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
