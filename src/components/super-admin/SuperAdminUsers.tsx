import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Building2, Shield, Crown, User, Briefcase } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  branch_name: string | null;
  roles: string[];
  created_at: string;
}

const roleLabels: Record<string, { label: string; color: string; icon: any }> = {
  superadmin: { label: 'Super Admin', color: 'bg-amber-500', icon: Crown },
  admin: { label: 'Admin', color: 'bg-blue-500', icon: Shield },
  manager: { label: 'Gerente', color: 'bg-purple-500', icon: Briefcase },
  technician: { label: 'Técnico', color: 'bg-green-500', icon: User },
  warehouse: { label: 'Almoxarife', color: 'bg-orange-500', icon: User },
  caixa: { label: 'Caixa', color: 'bg-pink-500', icon: User },
};

export function SuperAdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['superadmin-users'],
    queryFn: async (): Promise<UserData[]> => {
      // Fetch all users via edge function
      const { data: usersResult, error } = await supabase.functions.invoke('get-tenant-users');

      if (error) throw error;

      const profiles = usersResult?.users || [];

      // Fetch user roles
      const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');

      // Fetch branches for names
      const { data: branches } = await supabase.from('branches').select('id, name');
      const branchMap = new Map(branches?.map((b) => [b.id, b.name]));

      // Map roles to users
      const userRolesMap: Record<string, string[]> = {};
      rolesData?.forEach((r) => {
        if (!userRolesMap[r.user_id]) {
          userRolesMap[r.user_id] = [];
        }
        userRolesMap[r.user_id].push(r.role);
      });

      return profiles.map((profile: any) => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || null,
        branch_name: profile.branch_id ? branchMap.get(profile.branch_id) || null : null,
        roles: userRolesMap[profile.id] || [],
        created_at: profile.created_at || '',
      }));
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
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
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/70">Usuário</TableHead>
                    <TableHead className="text-white/70">E-mail</TableHead>
                    <TableHead className="text-white/70">Filial</TableHead>
                    <TableHead className="text-white/70">Cargos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {getInitials(user.full_name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-white">
                            {user.full_name || 'Sem nome'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/70">{user.email}</TableCell>
                      <TableCell className="text-white/70">
                        {user.branch_name ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {user.branch_name}
                          </span>
                        ) : (
                          <span className="text-white/40">Sem filial</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="text-white/40 text-xs">Sem cargo</span>
                          ) : (
                            user.roles.map((role) => {
                              const roleConfig = roleLabels[role] || {
                                label: role,
                                color: 'bg-gray-500',
                                icon: User,
                              };
                              return (
                                <Badge
                                  key={role}
                                  className={`${roleConfig.color} text-white text-xs`}
                                >
                                  {roleConfig.label}
                                </Badge>
                              );
                            })
                          )}
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

      <p className="text-xs text-white/40 text-center">
        Para gerenciar permissões de usuários, acesse Configurações → Usuários.
      </p>
    </div>
  );
}
