import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ScanLine, Camera, Flashlight, RotateCcw, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
  title?: string;
  description?: string;
  scannedItems?: string[];
  continuousMode?: boolean;
}

export function ScannerDialog({
  open,
  onOpenChange,
  onScan,
  title = 'Escanear Código',
  description = 'Posicione o código de barras dentro da área destacada',
  scannedItems = [],
  continuousMode = false,
}: ScannerDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const detectorRef = useRef<any>(null);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);

    try {
      // Stop any existing stream first
      stopCamera();

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia_not_supported');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.() as any;
      setHasFlash(capabilities?.torch === true);

      const v = videoRef.current;
      if (!v) throw new Error('video_not_found');

      // Mobile Safari / Android WebView helpers
      // @ts-ignore
      v.setAttribute('webkit-playsinline', 'true');
      v.setAttribute('playsinline', 'true');
      v.muted = true;
      v.autoplay = true;
      v.playsInline = true;

      // Force a clean attach
      v.pause?.();
      // @ts-ignore
      v.srcObject = null;
      // @ts-ignore
      v.srcObject = stream;

      // Wait metadata briefly (helps some Android devices render the first frame)
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(() => resolve(), 800);
        const onMeta = () => {
          window.clearTimeout(timeout);
          v.removeEventListener('loadedmetadata', onMeta);
          resolve();
        };
        v.addEventListener('loadedmetadata', onMeta, { once: true });
      });

      try {
        await v.play();
      } catch (e) {
        console.warn('video.play() failed:', e);
      }

      setIsScanning(true);
      scanningRef.current = true;

      // Start barcode detection (if supported)
      if ('BarcodeDetector' in window) {
        try {
          detectorRef.current = new (window as any).BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'data_matrix', 'itf'],
          });
          detectBarcodes();
        } catch (err) {
          console.warn('BarcodeDetector init failed:', err);
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err);

      let errorMessage = 'Não foi possível acessar a câmera';

      if (err?.name === 'NotAllowedError') {
        errorMessage = 'Permissão de câmera negada. Verifique as configurações do navegador.';
      } else if (err?.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
      } else if (err?.name === 'NotReadableError') {
        errorMessage = 'Câmera está sendo usada por outro aplicativo.';
      } else if (String(err?.message || err) === 'getUserMedia_not_supported') {
        errorMessage = 'Este navegador não suporta acesso à câmera.';
      }

      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  }, [stopCamera]);

  const detectBarcodes = useCallback(async () => {
    if (!scanningRef.current || !videoRef.current || !detectorRef.current) return;
    
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      
      if (barcodes.length > 0) {
        const scannedValue = barcodes[0].rawValue;
        if (scannedValue) {
          onScan(scannedValue);
          toast.success(`Código detectado: ${scannedValue}`);
          if (!continuousMode) {
            handleClose();
            return;
          }
        }
      }
    } catch (err) {
      // Continue scanning silently
    }
    
    if (scanningRef.current) {
      requestAnimationFrame(detectBarcodes);
    }
  }, [onScan, continuousMode]);

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashOn } as any]
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Flash toggle error:', err);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      if (!continuousMode) {
        handleClose();
      }
      setManualInput('');
    }
  };

  const handleClose = useCallback(() => {
    stopCamera();
    setManualInput('');
    setCameraError(null);
    setFlashOn(false);
    onOpenChange(false);
  }, [stopCamera, onOpenChange]);

  // Auto-start camera when dialog opens
  useEffect(() => {
    if (open) {
      setHasStarted(false);
      setCameraError(null);
      setFlashOn(false);
      setIsScanning(false);
      scanningRef.current = false;
      // Auto-start camera with a small delay for better reliability
      const timer = setTimeout(() => {
        setHasStarted(true);
        startCamera();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [open, stopCamera, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-background/80">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative mx-auto flex h-full w-full max-w-lg items-end sm:items-center justify-center p-3 sm:p-6">
        <Card className="w-full overflow-hidden shadow-lg">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                {hasFlash && isScanning && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFlash}
                    className={cn(flashOn && "bg-accent")}
                    aria-label="Alternar lanterna"
                  >
                    <Flashlight className={cn("h-5 w-5", flashOn && "text-primary")} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setHasStarted(true);
                    startCamera();
                  }}
                  aria-label="Iniciar/Reiniciar câmera"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Fechar">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{description}</p>

            {/* Camera Card */}
            <div className="relative overflow-hidden rounded-xl border bg-muted/30">
              <div className="relative aspect-video w-full">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover [transform:translateZ(0)]"
                  playsInline
                  autoPlay
                  muted
                  // @ts-ignore - iOS Safari
                  webkit-playsinline="true"
                />

                {/* Start overlay */}
                {!cameraError && !isScanning && (
                  <div className="absolute inset-0 grid place-items-center bg-background/60">
                    <div className="flex flex-col items-center gap-3 p-4 text-center">
                      <Camera className="h-10 w-10 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Pronto para escanear</p>
                        <p className="text-xs text-muted-foreground">Toque em “Iniciar câmera” para abrir o scanner.</p>
                      </div>
                      <Button
                        onClick={() => {
                          setHasStarted(true);
                          startCamera();
                        }}
                      >
                        Iniciar câmera
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {cameraError && (
                  <div className="absolute inset-0 grid place-items-center bg-background/70">
                    <div className="flex flex-col items-center gap-3 p-4 text-center">
                      <Camera className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{cameraError}</p>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setHasStarted(true);
                          startCamera();
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reticle */}
                {isScanning && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="relative w-[86%] max-w-[360px] aspect-[2/1]">
                      <div className="absolute inset-0 rounded-xl border-2 border-primary/80 shadow-sm" />
                      <div className="absolute -top-0.5 -left-0.5 h-7 w-7 rounded-tl-xl border-l-4 border-t-4 border-primary" />
                      <div className="absolute -top-0.5 -right-0.5 h-7 w-7 rounded-tr-xl border-r-4 border-t-4 border-primary" />
                      <div className="absolute -bottom-0.5 -left-0.5 h-7 w-7 rounded-bl-xl border-b-4 border-l-4 border-primary" />
                      <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-br-xl border-b-4 border-r-4 border-primary" />
                      <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_1.8s_ease-in-out_infinite]" />
                    </div>
                  </div>
                )}

                {/* Status */}
                {isScanning && (
                  <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-foreground">Câmera ativa</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scanned Items List */}
            {continuousMode && scannedItems.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  Itens Escaneados 
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {scannedItems.length}
                  </span>
                </Label>
                <div className="max-h-24 overflow-y-auto border rounded-lg divide-y bg-muted/20">
                  {scannedItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="font-mono truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Input */}
            <div className="space-y-2">
              <Label className="text-sm">Ou digite o código manualmente</Label>
              <div className="flex gap-2">
                <Input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Digite o código..."
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                  {continuousMode ? <Plus className="h-4 w-4" /> : 'OK'}
                </Button>
              </div>
            </div>

            {/* Close button for continuous mode */}
            {continuousMode && (
              <Button variant="outline" onClick={handleClose} className="w-full">
                Concluir
              </Button>
            )}

            {/* Custom scan animation keyframes */}
            <style>{`
              @keyframes scan {
                0%, 100% { top: 10%; }
                50% { top: 85%; }
              }
            `}</style>
          </CardContent>
        </Card>
      </div>
    </div>,
    document.body
  );
}