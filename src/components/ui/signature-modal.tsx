import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title?: string;
}

export function SignatureModal({ open, onClose, onSave, title = "Assinatura" }: SignatureModalProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [signature, setSignature] = React.useState<string | null>(null);
  const [needsCssRotation, setNeedsCssRotation] = React.useState(false);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  const initCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Ensure minimum dimensions
    const width = Math.max(rect.width, 300);
    const height = Math.max(rect.height, 150);
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    setIsReady(true);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setSignature(null);
      setHasSignature(false);
      setIsReady(false);
      return;
    }

    const root = document.documentElement;
    root.dataset.allowLandscape = "true";

    let mounted = true;

    const isDeviceInLandscape = () => {
      if (screen.orientation) {
        return screen.orientation.type.includes('landscape');
      }
      return window.innerWidth > window.innerHeight;
    };

    const lockOrientation = async () => {
      let lockSucceeded = false;
      
      if (screen.orientation && 'lock' in screen.orientation) {
        try {
          await (screen.orientation as any).lock('landscape');
          lockSucceeded = true;
        } catch {
          lockSucceeded = false;
        }
      }

      if (mounted) {
        const needsRotation = !lockSucceeded && !isDeviceInLandscape();
        setNeedsCssRotation(needsRotation);
        
        // Initialize canvas after rotation is settled
        setTimeout(initCanvas, 100);
        setTimeout(initCanvas, 300);
        setTimeout(initCanvas, 500);
      }
    };

    lockOrientation();

    const handleOrientationChange = () => {
      setTimeout(() => {
        if (mounted) {
          setNeedsCssRotation(!isDeviceInLandscape());
          // Reinit canvas after orientation change
          setTimeout(initCanvas, 100);
          setTimeout(initCanvas, 300);
        }
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      mounted = false;
      delete root.dataset.allowLandscape;
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (screen.orientation && 'unlock' in screen.orientation) {
        try {
          (screen.orientation as any).unlock();
        } catch {}
      }
    };
  }, [open, initCanvas]);

  const getCoordinatesFromPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // When CSS rotation is applied (90deg), we need to swap and adjust coordinates
    if (needsCssRotation) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const relX = clientX - centerX;
      const relY = clientY - centerY;

      const rotatedX = relY;
      const rotatedY = -relX;

      const canvasX = rotatedX + rect.height / 2;
      const canvasY = rotatedY + rect.width / 2;

      const scaleX = canvas.width / rect.height / (window.devicePixelRatio || 1);
      const scaleY = canvas.height / rect.width / (window.devicePixelRatio || 1);

      return {
        x: canvasX * scaleX,
        y: canvasY * scaleY,
      };
    }

    const scaleX = canvas.width / rect.width / (window.devicePixelRatio || 1);
    const scaleY = canvas.height / rect.height / (window.devicePixelRatio || 1);

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    // Capture pointer so move/up keep firing even if finger leaves the canvas
    try {
      (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { x, y } = getCoordinatesFromPoint(e.clientX, e.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinatesFromPoint(e.clientX, e.clientY);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isDrawing) return;
    setIsDrawing(false);

    // Save signature when drawing stops
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL("image/png");
      setSignature(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignature(null);
  };

  const handleSave = () => {
    if (signature) {
      try {
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock();
        }
      } catch {}
      onSave(signature);
      onClose();
    }
  };

  const handleCancel = () => {
    try {
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch {}
    onClose();
  };

  if (!open) return null;

  const rotationStyle = needsCssRotation ? {
    transform: 'rotate(90deg)',
    transformOrigin: 'center center',
    width: '100dvh',
    height: '100dvw',
    left: 'calc(50% - 50dvh)',
    top: 'calc(50% - 50dvw)',
    position: 'fixed' as const,
  } : {};

  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 z-[9999] bg-background flex flex-col",
        "landscape-locked"
      )}
      style={{ ...rotationStyle, touchAction: 'none', pointerEvents: 'auto' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20 flex-shrink-0 bg-primary">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-5 w-5" />
          </Button>
          <h3 className="text-base font-semibold text-primary-foreground">
            {title}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearCanvas}
            disabled={!hasSignature}
            className="text-primary-foreground hover:bg-primary-foreground/20 disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Signature canvas area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden p-4 flex flex-col bg-muted/30" 
        style={{ minHeight: '200px', touchAction: 'none', pointerEvents: 'auto' }}
      >
        <div 
          className="flex-1 rounded-lg overflow-hidden bg-white border-2 border-dashed border-border relative"
          style={{ touchAction: 'none', pointerEvents: 'auto' }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ touchAction: 'none', pointerEvents: 'auto', userSelect: 'none', WebkitUserSelect: 'none' }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />
          {!hasSignature && isReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-muted-foreground/50 text-lg">Assine aqui</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center pt-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {hasSignature ? '✓ Assinatura registrada' : 'Desenhe sua assinatura no quadro acima'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 p-4 border-t border-border/20 flex-shrink-0 bg-background">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="flex-1 h-12 text-base"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!signature}
          className="flex-1 h-12 text-base"
        >
          <Check className="h-5 w-5 mr-1" />
          Confirmar
        </Button>
      </div>
    </div>,
    document.body
  );
}
