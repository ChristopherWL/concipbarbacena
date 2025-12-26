import * as React from "react";
import { Button } from "@/components/ui/button";
import { X, Check, Trash2, Pen, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  open: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title?: string;
}

/**
 * Signature pad that opens fullscreen in landscape mode.
 * Tries to lock orientation to landscape; if not possible, shows a prompt to rotate.
 */
export function SignaturePad({ open, onClose, onSave, title = "Assinatura" }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(false);
  const [isLandscape, setIsLandscape] = React.useState(false);
  const [showRotatePrompt, setShowRotatePrompt] = React.useState(false);

  // Check if device is in landscape
  const checkLandscape = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    // Use screen.orientation if available, otherwise compare dimensions
    if (screen.orientation) {
      return screen.orientation.type.includes("landscape");
    }
    return window.innerWidth > window.innerHeight;
  }, []);

  // Handle orientation and lock attempts
  React.useEffect(() => {
    if (!open) {
      setHasSignature(false);
      setShowRotatePrompt(false);
      return;
    }

    let mounted = true;

    const tryLockLandscape = async () => {
      // Check current orientation
      const currentlyLandscape = checkLandscape();
      
      if (currentlyLandscape) {
        if (mounted) {
          setIsLandscape(true);
          setShowRotatePrompt(false);
        }
        return;
      }

      // Try to lock to landscape
      let lockSucceeded = false;
      if (screen.orientation && "lock" in screen.orientation) {
        try {
          await (screen.orientation as any).lock("landscape");
          lockSucceeded = true;
        } catch {
          // Lock failed (not fullscreen, iOS, etc.)
          lockSucceeded = false;
        }
      }

      if (mounted) {
        if (lockSucceeded) {
          setIsLandscape(true);
          setShowRotatePrompt(false);
        } else {
          // Can't lock - show prompt to rotate
          setIsLandscape(false);
          setShowRotatePrompt(true);
        }
      }
    };

    tryLockLandscape();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(() => {
        if (mounted) {
          const nowLandscape = checkLandscape();
          setIsLandscape(nowLandscape);
          setShowRotatePrompt(!nowLandscape);
          if (nowLandscape) {
            setTimeout(initCanvas, 100);
          }
        }
      }, 100);
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    // Initialize canvas after a short delay
    const timer = setTimeout(() => {
      if (checkLandscape()) {
        initCanvas();
      }
    }, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
      
      // Unlock orientation when closing
      if (screen.orientation && "unlock" in screen.orientation) {
        try {
          (screen.orientation as any).unlock();
        } catch {}
      }
    };
  }, [open, checkLandscape]);

  // Re-init canvas when landscape changes
  React.useEffect(() => {
    if (open && isLandscape) {
      const timer = setTimeout(initCanvas, 100);
      return () => clearTimeout(timer);
    }
  }, [open, isLandscape]);

  const initCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Scale for retina
    ctx.scale(dpr, dpr);

    // Set drawing style
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    // Capture pointer for reliable tracking
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    // Unlock orientation before closing
    if (screen.orientation && "unlock" in screen.orientation) {
      try {
        (screen.orientation as any).unlock();
      } catch {}
    }

    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
    onClose();
  };

  const handleClose = () => {
    // Unlock orientation before closing
    if (screen.orientation && "unlock" in screen.orientation) {
      try {
        (screen.orientation as any).unlock();
      } catch {}
    }
    onClose();
  };

  if (!open) return null;

  // Show rotate prompt if not in landscape and can't lock
  if (showRotatePrompt && !isLandscape) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8"
        style={{ touchAction: "none" }}
      >
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <RotateCcw className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Gire o celular</h3>
            <p className="text-muted-foreground">
              Para assinar, coloque o celular na horizontal (modo paisagem).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="mt-4"
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-background flex flex-col"
      style={{ touchAction: "none" }}
    >
      {/* Header - horizontal layout for landscape */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-primary flex-shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-5 w-5" />
        </Button>
        <h3 className="text-base font-semibold text-primary-foreground">{title}</h3>
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

      {/* Canvas area - optimized for landscape */}
      <div 
        ref={containerRef}
        className="flex-1 p-3 flex flex-col min-h-0 bg-muted/30"
      >
        <div className="flex-1 rounded-lg overflow-hidden bg-white border-2 border-dashed border-border relative">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ 
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-muted-foreground/50 text-lg">Assine aqui</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer buttons - side by side for landscape */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-background flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          className="flex-1 h-10 text-sm"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!hasSignature}
          className="flex-1 h-10 text-sm"
        >
          <Check className="h-4 w-4 mr-1" />
          Confirmar
        </Button>
      </div>
    </div>
  );
}

/**
 * Inline signature field that shows a "tap to sign" card.
 * When tapped, opens the SignaturePad fullscreen in landscape.
 */
interface SignatureFieldProps {
  value: string | null;
  onChange: (signatureDataUrl: string | null) => void;
  className?: string;
  title?: string;
}

export function SignatureField({ value, onChange, className, title = "Assinatura" }: SignatureFieldProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSave = (dataUrl: string) => {
    onChange(dataUrl);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <>
      <Card 
        className={cn(
          "cursor-pointer hover:border-primary/50 transition-colors",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-4 flex flex-col items-center justify-center min-h-[120px] gap-2">
          {value ? (
            <>
              <img 
                src={value} 
                alt="Assinatura" 
                className="max-h-16 max-w-full object-contain"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600 font-medium">✓ Assinatura registrada</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-xs h-6 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Pen className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Toque para assinar
              </span>
            </>
          )}
        </CardContent>
      </Card>

      <SignaturePad
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
        title={title}
      />
    </>
  );
}
