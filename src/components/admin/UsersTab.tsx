import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminUsers, UserProfile } from '@/hooks/useAdminData';
import { UserEditDialog } from './UserEditDialog';

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  technician: 'Operacional',
  warehouse: 'Almoxarife',
  caixa: 'Caixa',
};

const roleColors: Record<string, string> = {
  superadmin: 'bg-purple-500',
  admin: 'bg-blue-500',
  manager: 'bg-green-500',
  technician: 'bg-orange-500',
  warehouse: 'bg-yellow-500',
  caixa: 'bg-gray-500',
};

export function UsersTab() {
  const { data: users, isLoading } = useAdminUsers();
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const getUserRole = (user: UserProfile): string => {
    return user.roles?.[0]?.role || 'Sem cargo';
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Filial</TableHead>
              <TableHead>Equipe</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!users || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const role = getUserRole(user);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name || 'Sem nome'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${roleColors[role] || ''} text-white`}
                      >
                        {roleLabels[role] || role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.branch?.name || (
                        <span className="text-muted-foreground">Sem filial</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.team?.name || (
                        <span className="text-muted-foreground">Sem equipe</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      <UserEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={editingUser}
      />
    </Card>
  );
}
