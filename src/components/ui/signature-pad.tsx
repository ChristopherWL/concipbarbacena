import * as React from "react";
import { Button } from "@/components/ui/button";
import { X, Check, Trash2, Pen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  open: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title?: string;
}

/**
 * Signature pad that opens fullscreen.
 * Automatically rotates content 90deg when in portrait mode for landscape signing.
 */
export function SignaturePad({ open, onClose, onSave, title = "Assinatura" }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const drawingAreaRef = React.useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(false);
  const [isPortrait, setIsPortrait] = React.useState(false);

  // Check if in portrait mode (more reliable than innerWidth/innerHeight on mobile)
  const checkPortrait = React.useCallback(() => {
    if (typeof window === "undefined") return false;

    try {
      return window.matchMedia?.("(orientation: portrait)")?.matches ?? (window.innerHeight > window.innerWidth);
    } catch {
      return window.innerHeight > window.innerWidth;
    }
  }, []);

  // Handle open and orientation
  React.useEffect(() => {
    if (!open) {
      setHasSignature(false);
      return;
    }

    const updateOrientation = () => {
      setIsPortrait(checkPortrait());
    };

    const onResize = () => updateOrientation();
    const onOrientationChange = () => {
      // iOS can lag orientation metrics; re-check after layout settles
      setTimeout(updateOrientation, 150);
    };

    updateOrientation();

    // Try to rotate/lock to landscape automatically (silent best-effort)
    const orientation = (screen as any)?.orientation;
    const lockPromise: Promise<unknown> | undefined = orientation?.lock?.("landscape");
    lockPromise?.catch?.(() => {
      // Not supported or blocked by the browser; keep working without locking.
    });

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientationChange);
    window.matchMedia?.("(orientation: portrait)")?.addEventListener?.("change", onResize);

    // Also listen to the visual viewport (mobile browser UI can change the viewport without a full resize)
    const vv = window.visualViewport;
    vv?.addEventListener?.("resize", onResize);
    vv?.addEventListener?.("scroll", onResize);

    // Prevent body scroll when signature pad is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientationChange);
      window.matchMedia?.("(orientation: portrait)")?.removeEventListener?.("change", onResize);
      vv?.removeEventListener?.("resize", onResize);
      vv?.removeEventListener?.("scroll", onResize);
      document.body.style.overflow = "";

      // Restore orientation lock if supported
      (screen as any)?.orientation?.unlock?.();
    };
  }, [open, checkPortrait]);

  // Initialize canvas when opened or orientation changes
  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(initCanvas, 50);
    return () => clearTimeout(timer);
  }, [open, isPortrait]);

  const initCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const drawingArea = drawingAreaRef.current;
    if (!canvas || !container || !drawingArea) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // IMPORTANT: size the canvas based on the visible drawing area (not the outer container).
    // Using a larger container caused the canvas element to overflow and only part of it to be interactive.
    const rect = drawingArea.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    // Keep CSS size controlled by layout (w-full/h-full). Only set the internal bitmap size.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    // Map from viewport pixels -> canvas drawing coordinates (CSS pixels)
    // We draw in CSS pixels because initCanvas sets ctx.setTransform(dpr, ...)
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;

    const scaleX = rect.width ? cssW / rect.width : 1;
    const scaleY = rect.height ? cssH / rect.height : 1;

    return {
      x: pointerX * scaleX,
      y: pointerY * scaleY,
    };
  };

  const debugOnceRef = React.useRef(false);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    // Debug (single print) to diagnose coordinate mismatches on real devices
    if (!debugOnceRef.current) {
      debugOnceRef.current = true;
      const rect = canvas.getBoundingClientRect();
      // eslint-disable-next-line no-console
      console.log("[SignaturePad debug]", {
        isPortrait,
        devicePixelRatio: window.devicePixelRatio,
        client: { x: e.clientX, y: e.clientY },
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        offset: { w: canvas.offsetWidth, h: canvas.offsetHeight },
      });
    }

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

    // No CSS rotation: what you see is what gets saved.
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
    onClose();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-background"
      style={{ touchAction: "none" }}
    >
      <div 
        className="fixed inset-0 flex flex-col bg-background"
        style={{ touchAction: "none" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-primary flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
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

        {/* Canvas area */}
        <div 
          ref={containerRef}
          className="flex-1 p-3 flex flex-col min-h-0 bg-muted/30"
        >
          <div
            ref={drawingAreaRef}
            className="flex-1 rounded-lg overflow-hidden bg-white border-2 border-dashed border-border relative"
          >
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

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-background flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
