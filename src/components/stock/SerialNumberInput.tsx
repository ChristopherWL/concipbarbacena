import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Barcode, Plus, X, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { ScannerDialog } from './ScannerDialog';

interface SerialNumberInputProps {
  quantity: number;
  value: string[];
  onChange: (serials: string[]) => void;
  productName: string;
}

export function SerialNumberInput({ quantity, value, onChange, productName }: SerialNumberInputProps) {
  const [currentSerial, setCurrentSerial] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleAddSerial = (serial?: string) => {
    const serialToAdd = serial || currentSerial.trim();

    if (!serialToAdd) {
      toast.error('Digite um número de série');
      return;
    }

    if (value.includes(serialToAdd)) {
      toast.error('Este número de série já foi adicionado');
      return;
    }

    if (value.length >= quantity) {
      toast.error(`Quantidade máxima de ${quantity} número(s) de série atingida`);
      return;
    }

    const next = [...value, serialToAdd];
    onChange(next);
    setCurrentSerial('');

    if (serial) {
      toast.success(`Serial ${serialToAdd} detectado!`);
      if (next.length >= quantity) setScannerOpen(false);
    }
  };

  const handleRemoveSerial = (serial: string) => {
    onChange(value.filter(s => s !== serial));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSerial();
    }
  };

  const remaining = quantity - value.length;

  return (
    <>
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-dashed">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Barcode className="h-4 w-4 text-primary" />
            Números de Série - {productName}
          </Label>
          <Badge variant={remaining === 0 ? 'default' : 'secondary'}>
            {value.length}/{quantity}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Digite ou escaneie o número de série"
            value={currentSerial}
            onChange={(e) => setCurrentSerial(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={remaining === 0}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setScannerOpen(true)}
            disabled={remaining === 0}
            className="shrink-0"
            title="Escanear código de barras"
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleAddSerial()}
            disabled={remaining === 0}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {remaining > 0 && (
          <p className="text-sm text-muted-foreground">
            Faltam {remaining} número(s) de série
          </p>
        )}

        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {value.map((serial) => (
              <Badge 
                key={serial} 
                variant="secondary" 
                className="pl-3 pr-1 py-1 flex items-center gap-2"
              >
                <span className="font-mono text-xs">{serial}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-destructive/20"
                  onClick={() => handleRemoveSerial(serial)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Scanner Dialog */}
      <ScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(serial) => handleAddSerial(serial)}
        title={`Escanear Serial - ${productName}`}
        description="Aponte para o código de barras. Os itens escaneados aparecerão na lista."
        scannedItems={value}
        continuousMode
      />
    </>
  );
}
