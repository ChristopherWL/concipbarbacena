import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  UserProfile, 
  useBranches, 
  useAdminTeams, 
  useUpdateUserProfile 
} from '@/hooks/useAdminData';

const roles = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'technician', label: 'Operacional' },
  { value: 'warehouse', label: 'Almoxarife' },
  { value: 'caixa', label: 'Caixa' },
];

const userSchema = z.object({
  role: z.string().min(1, 'Cargo é obrigatório'),
  branch_id: z.string().optional(),
  team_id: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export function UserEditDialog({ open, onOpenChange, user }: UserEditDialogProps) {
  const { data: branches } = useBranches();
  const { data: teams } = useAdminTeams();
  const updateUserProfile = useUpdateUserProfile();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: '',
      branch_id: '',
      team_id: '',
    },
  });

  const selectedBranchId = form.watch('branch_id');

  useEffect(() => {
    if (user) {
      form.reset({
        role: user.roles?.[0]?.role || '',
        branch_id: user.branch_id || '',
        team_id: user.team_id || '',
      });
    } else {
      form.reset({
        role: '',
        branch_id: '',
        team_id: '',
      });
    }
  }, [user, form]);

  const onSubmit = async (values: UserFormValues) => {
    if (!user) return;
    
    try {
      await updateUserProfile.mutateAsync({
        userId: user.id,
        role: values.role,
        branchId: values.branch_id || null,
        teamId: values.team_id || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const activeBranches = branches?.filter(b => b.is_active) || [];
  const filteredTeams = selectedBranchId 
    ? teams?.filter(t => t.branch_id === selectedBranchId) || []
    : teams || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        {user && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="font-medium">{user.full_name || 'Sem nome'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branch_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filial</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear team when branch changes
                      form.setValue('team_id', '');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma filial" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {activeBranches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="team_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipe</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma equipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {filteredTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateUserProfile.isPending}
              >
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
