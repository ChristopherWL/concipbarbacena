import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Barcode, Plus, X, Camera, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

interface SerialNumberInputProps {
  quantity: number;
  value: string[];
  onChange: (serials: string[]) => void;
  productName: string;
}

export function SerialNumberInput({ quantity, value, onChange, productName }: SerialNumberInputProps) {
  const [currentSerial, setCurrentSerial] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef(false);

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

    onChange([...value, serialToAdd]);
    setCurrentSerial('');
    
    if (serial) {
      toast.success(`Serial ${serialToAdd} detectado!`);
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

  const startScanner = async () => {
    try {
      // Request camera with constraints optimized for mobile
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      isScanningRef.current = true;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready before playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      
      // Try to use BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'data_matrix']
        });
        
        const detectBarcodes = async () => {
          if (!videoRef.current || !isScanningRef.current) return;
          
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const detectedSerial = barcodes[0].rawValue;
              handleAddSerial(detectedSerial);
              stopScanner();
              return;
            }
          } catch (err) {
            // Continue scanning
          }
          
          if (isScanningRef.current) {
            requestAnimationFrame(detectBarcodes);
          }
        };
        
        // Small delay to ensure video is playing
        setTimeout(detectBarcodes, 500);
      } else {
        toast.info('Scanner automático não suportado. Use o campo de texto para digitar o serial.');
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Não foi possível acessar a câmera. Verifique as permissões.');
      setScannerOpen(false);
    }
  };

  const stopScanner = () => {
    isScanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScannerOpen(false);
  };

  useEffect(() => {
    if (scannerOpen) {
      startScanner();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [scannerOpen]);

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
      <Dialog open={scannerOpen} onOpenChange={(open) => !open && stopScanner()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Escanear Código de Barras
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
                // @ts-ignore - webkit attribute for iOS
                webkit-playsinline="true"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/3 border-2 border-primary rounded-lg animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Posicione o código de barras dentro da área destacada
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Ou digite manualmente..."
                value={currentSerial}
                onChange={(e) => setCurrentSerial(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSerial();
                    stopScanner();
                  }
                }}
              />
              <Button onClick={() => { handleAddSerial(); stopScanner(); }} disabled={!currentSerial}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
