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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Team, useBranches, useCreateAdminTeam, useUpdateAdminTeam } from '@/hooks/useAdminData';

const teamSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  branch_id: z.string().optional(),
  color: z.string().default('#3b82f6'),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export function TeamFormDialog({ open, onOpenChange, team }: TeamFormDialogProps) {
  const { data: branches } = useBranches();
  const createTeam = useCreateAdminTeam();
  const updateTeam = useUpdateAdminTeam();
  const isEditing = !!team;

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      description: '',
      branch_id: '',
      color: '#3b82f6',
    },
  });

  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name || '',
        description: team.description || '',
        branch_id: team.branch_id || '',
        color: team.color || '#3b82f6',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        branch_id: '',
        color: '#3b82f6',
      });
    }
  }, [team, form]);

  const onSubmit = async (values: TeamFormValues) => {
    try {
      const data = {
        ...values,
        branch_id: values.branch_id || undefined,
      };
      
      if (isEditing) {
        await updateTeam.mutateAsync({ id: team.id, ...data });
      } else {
        await createTeam.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const activeBranches = branches?.filter(b => b.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da equipe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição da equipe" {...field} />
                  </FormControl>
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
                    onValueChange={field.onChange}
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input type="color" className="w-16 h-10 p-1" {...field} />
                    </FormControl>
                    <Input 
                      value={field.value} 
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
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
                disabled={createTeam.isPending || updateTeam.isPending}
              >
                {isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
