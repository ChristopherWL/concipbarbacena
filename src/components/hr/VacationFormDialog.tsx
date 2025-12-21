import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VacationFormDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="text-primary-foreground">Registrar Férias</DialogTitle>
        </DialogHeader>
        <div className="text-center py-8 text-muted-foreground">
          Formulário em desenvolvimento
        </div>
      </DialogContent>
    </Dialog>
  );
}
