import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTechnicians, useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '@/hooks/useTeams';
import { useVehicles } from '@/hooks/useFleet';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, UsersRound, Truck, Trash2, Pencil } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';
import { Team } from '@/types/teams';

export default function Equipes() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const { isReadOnly } = useDirectorBranch();
  const { data: technicians = [] } = useTechnicians();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: vehicles = [] } = useVehicles();
  const { employees } = useEmployees();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  // Filter active employees
  const activeEmployees = employees.filter(e => e.status === 'ativo');

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', leader_employee_id: '', vehicle_id: '', color: '#3b82f6', member_employee_ids: [] as string[] });


  const openCreateDialog = () => {
    setEditingTeam(null);
    setTeamForm({ name: '', description: '', leader_employee_id: '', vehicle_id: '', color: '#3b82f6', member_employee_ids: [] });
    setTeamDialogOpen(true);
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || '',
      leader_employee_id: team.leader_employee_id || '',
      vehicle_id: team.vehicle_id || '',
      color: team.color,
      member_employee_ids: team.members?.map(m => m.employee_id).filter(Boolean) as string[] || [],
    });
    setTeamDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    if (!teamForm.name) { toast.error('Nome é obrigatório'); return; }
    
    try {
      if (editingTeam) {
        await updateTeam.mutateAsync({
          id: editingTeam.id,
          name: teamForm.name,
          description: teamForm.description,
          leader_employee_id: teamForm.leader_employee_id || undefined,
          vehicle_id: teamForm.vehicle_id || undefined,
          color: teamForm.color,
          member_employee_ids: teamForm.member_employee_ids,
        });
      } else {
        await createTeam.mutateAsync({
          name: teamForm.name,
          description: teamForm.description,
          leader_employee_id: teamForm.leader_employee_id || undefined,
          vehicle_id: teamForm.vehicle_id || undefined,
          color: teamForm.color,
          member_employee_ids: teamForm.member_employee_ids,
        });
      }
      setTeamDialogOpen(false);
      setEditingTeam(null);
      setTeamForm({ name: '', description: '', leader_employee_id: '', vehicle_id: '', color: '#3b82f6', member_employee_ids: [] });
    } catch (error) {
      // Error is already handled by the mutation's onError callback
      console.error('Save team error:', error);
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleDeleteTeam = async () => {
    if (teamToDelete) {
      await deleteTeam.mutateAsync(teamToDelete.id);
      setTeamToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in" data-tour="teams-content">
        <PageHeader
          title="Equipes"
          description="Gerencie suas equipes de trabalho"
        />

        {!isReadOnly && (
          <div className="flex justify-center">
            <Button onClick={openCreateDialog} className="gap-2">
              <UsersRound className="h-4 w-4" />
              Nova Equipe
            </Button>
          </div>
        )}

        {teamsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : teams.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <UsersRound className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma equipe</h3>
              <p className="text-sm text-muted-foreground">Crie sua primeira equipe</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {teams.map(team => (
              <Card 
                key={team.id} 
                className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => openEditDialog(team)}
              >
                {/* Top Banner with gradient */}
                <div 
                  className="h-20 relative"
                  style={{ 
                    background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}90 100%)`
                  }}
                >
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }} />
                  
                  {/* Actions - hidden for read-only */}
                  {!isReadOnly && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0"
                        onClick={(e) => { e.stopPropagation(); openEditDialog(team); }}
                      >
                        <Pencil className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/20 hover:bg-red-500/80 backdrop-blur-sm border-0"
                        onClick={(e) => { e.stopPropagation(); setTeamToDelete(team); }}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  )}

                  {/* Team Icon */}
                  <div className="absolute -bottom-6 left-4">
                    <div className="w-14 h-14 rounded-xl bg-card shadow-lg flex items-center justify-center border-2 border-background">
                      <UsersRound className="h-7 w-7" style={{ color: team.color }} />
                    </div>
                  </div>
                </div>

                <CardContent className="pt-10 pb-4 px-4">
                  {/* Team Name & Description */}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-foreground">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{team.description}</p>
                    )}
                  </div>

                  {/* Leader & Vehicle */}
                  <div className="space-y-2 mb-4">
                    {(team.leader_employee || team.leader) && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback 
                            className="text-[10px] font-medium"
                            style={{ backgroundColor: `${team.color}20`, color: team.color }}
                          >
                            {getInitials(team.leader_employee?.name || team.leader?.name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{team.leader_employee?.name || team.leader?.name}</span>
                        <Badge 
                          className="text-[10px] px-1.5 py-0 h-5"
                          style={{ backgroundColor: `${team.color}15`, color: team.color, border: 'none' }}
                        >
                          Líder
                        </Badge>
                      </div>
                    )}
                    {team.vehicle && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Truck className="h-4 w-4" />
                        <span className="text-sm">{team.vehicle.plate}</span>
                      </div>
                    )}
                  </div>

                  {/* Members Section */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {team.members && team.members.slice(0, 5).map(m => {
                          const memberName = m.employee?.name || m.technician?.name || '';
                          return (
                            <Avatar 
                              key={m.id} 
                              className="h-8 w-8 border-2 border-card ring-0"
                              title={memberName}
                            >
                              <AvatarFallback 
                                className="text-[10px] font-medium"
                                style={{ backgroundColor: `${team.color}20`, color: team.color }}
                              >
                                {getInitials(memberName)}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                        {team.members && team.members.length > 5 && (
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-card"
                            style={{ backgroundColor: `${team.color}20`, color: team.color }}
                          >
                            +{team.members.length - 5}
                          </div>
                        )}
                        {(!team.members || team.members.length === 0) && (
                          <span className="text-xs text-muted-foreground">Sem membros</span>
                        )}
                      </div>
                      {team.members && team.members.length > 0 && (
                        <span 
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${team.color}15`, color: team.color }}
                        >
                          {team.members.length} membro{team.members.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Team Dialog */}
        <Dialog open={teamDialogOpen} onOpenChange={(open) => { setTeamDialogOpen(open); if (!open) setEditingTeam(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">{editingTeam ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {editingTeam ? 'Atualize os dados da equipe' : 'Crie uma nova equipe de trabalho'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label>Nome *</Label>
                  <Input placeholder="Nome da equipe" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input type="color" value={teamForm.color} onChange={e => setTeamForm({...teamForm, color: e.target.value})} className="h-10" />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input placeholder="Descrição da equipe" value={teamForm.description} onChange={e => setTeamForm({...teamForm, description: e.target.value})} />
              </div>
              <div>
                <Label>Líder</Label>
                <Select value={teamForm.leader_employee_id} onValueChange={v => setTeamForm({...teamForm, leader_employee_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o líder" /></SelectTrigger>
                  <SelectContent>{activeEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Veículo</Label>
                <Select value={teamForm.vehicle_id} onValueChange={v => setTeamForm({...teamForm, vehicle_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                  <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Membros (Colaboradores)</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {activeEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nenhum colaborador ativo cadastrado. Cadastre colaboradores em RH.
                    </p>
                  ) : (
                    activeEmployees.map(e => (
                      <label key={e.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={teamForm.member_employee_ids.includes(e.id)} onCheckedChange={(checked) => {
                          setTeamForm(prev => ({
                            ...prev,
                            member_employee_ids: checked ? [...prev.member_employee_ids, e.id] : prev.member_employee_ids.filter(id => id !== e.id)
                          }));
                        }} />
                        <span className="text-sm">{e.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveTeam} disabled={createTeam.isPending || updateTeam.isPending}>
                  {(createTeam.isPending || updateTeam.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTeam ? 'Salvar' : 'Criar Equipe'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Team Confirmation */}
        <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir equipe?</AlertDialogTitle>
              <AlertDialogDescription>
                A equipe "{teamToDelete?.name}" será removida do sistema. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
