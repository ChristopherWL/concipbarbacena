import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, UsersRound, Building2, Users } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  branch_id: string | null;
  branch_name?: string;
  member_count: number;
  is_active: boolean;
}

export function SuperAdminTeams() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['superadmin-teams'],
    queryFn: async (): Promise<Team[]> => {
      // Fetch teams
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('id, name, branch_id, is_active')
        .order('name');

      if (error) throw error;

      // Fetch branches for names
      const { data: branches } = await supabase.from('branches').select('id, name');
      const branchMap = new Map(branches?.map((b) => [b.id, b.name]));

      // Fetch team_members to count members per team
      const { data: teamMembers } = await supabase.from('team_members').select('team_id');

      const teamMemberCounts: Record<string, number> = {};
      teamMembers?.forEach((member) => {
        if (member.team_id) {
          teamMemberCounts[member.team_id] = (teamMemberCounts[member.team_id] || 0) + 1;
        }
      });

      return (teamsData || []).map((team) => ({
        id: team.id,
        name: team.name,
        branch_id: team.branch_id,
        branch_name: team.branch_id ? branchMap.get(team.branch_id) || 'Desconhecida' : null,
        member_count: teamMemberCounts[team.id] || 0,
        is_active: team.is_active ?? true,
      }));
    },
  });

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Buscar equipes..."
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
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe cadastrada'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/70">Equipe</TableHead>
                    <TableHead className="text-white/70">Filial</TableHead>
                    <TableHead className="text-white/70 text-center">Membros</TableHead>
                    <TableHead className="text-white/70">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <UsersRound className="h-4 w-4 text-purple-400" />
                          </div>
                          <span className="font-medium text-white">{team.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/70">
                        {team.branch_name ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {team.branch_name}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-white/50" />
                          <span className="text-white/70">{team.member_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            team.is_active
                              ? 'bg-green-600 hover:bg-green-600'
                              : 'bg-white/10 text-white/50'
                          }
                        >
                          {team.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-white/40 text-center">
        Para gerenciar equipes, acesse o módulo de Equipes no menu principal.
      </p>
    </div>
  );
}
