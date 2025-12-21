import { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pen, X, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignatureCanvasProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  className?: string;
  inline?: boolean; // When true, renders canvas directly without expand/collapse
}

export function SignatureCanvas({ onSignatureChange, className, inline = false }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempSignature, setTempSignature] = useState<string | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the parent container dimensions
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Ensure minimum dimensions
    const width = Math.max(rect.width, 300);
    const height = Math.max(rect.height, 150);
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Set CSS size to match
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Initialize canvas for inline mode
  useEffect(() => {
    if (inline) {
      const timer1 = setTimeout(initCanvas, 100);
      const timer2 = setTimeout(initCanvas, 300);
      const timer3 = setTimeout(initCanvas, 500);
      const timer4 = setTimeout(initCanvas, 800);
      
      const handleResize = () => {
        // Multiple resets to handle orientation settling
        setTimeout(initCanvas, 50);
        setTimeout(initCanvas, 200);
        setTimeout(initCanvas, 400);
      };
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, [inline, initCanvas]);

  useEffect(() => {
    if (isExpanded) {
      // Multiple timeouts to handle orientation changes and layout settling
      const timer1 = setTimeout(initCanvas, 100);
      const timer2 = setTimeout(initCanvas, 300);
      const timer3 = setTimeout(initCanvas, 500);
      
      // Also reinit on resize/orientation change
      const handleResize = () => {
        setTimeout(initCanvas, 100);
      };
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, [isExpanded, initCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0 };
    }
    
    // Scale coordinates to match canvas internal resolution
    const scaleX = canvas.width / rect.width / (window.devicePixelRatio || 1);
    const scaleY = canvas.height / rect.height / (window.devicePixelRatio || 1);
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // For inline mode, save signature immediately when drawing stops
    if (inline) {
      const canvas = canvasRef.current;
      if (canvas && hasSignature) {
        const dataUrl = canvas.toDataURL('image/png');
        onSignatureChange(dataUrl);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  const handleExpand = () => {
    setHasSignature(false);
    setTempSignature(null);
    setIsExpanded(true);
  };

  const closeExpanded = () => {
    setIsExpanded(false);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setHasSignature(false);
    setTempSignature(null);
    onSignatureChange(null);
    closeExpanded();
  };

  const handleSave = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      setTempSignature(dataUrl);
      onSignatureChange(dataUrl);
    }
    closeExpanded();
  };

  // Inline mode - canvas renders directly in parent (used in MobileFormWizard landscape step)
  if (inline) {
    return (
      <div ref={containerRef} className={cn("flex flex-col h-full w-full", className)}>
        <div 
          className="flex-1 rounded-lg overflow-hidden bg-card border border-border relative"
          style={{ minHeight: '180px', minWidth: '300px' }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair bg-white"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        <div className="flex items-center justify-between pt-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {hasSignature ? '✓ Assinatura registrada' : 'Assine no quadro acima'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            disabled={!hasSignature}
            className="text-xs h-8"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        </div>
      </div>
    );
  }

  // Expanded full-screen PORTRAIT view - locked orientation
  if (isExpanded) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-background flex flex-col signature-canvas-fullscreen"
        style={{ 
          // Force portrait orientation on mobile
          transform: 'rotate(0deg)',
          WebkitTransform: 'rotate(0deg)'
        }}
        onClick={(e) => {
          // Prevent clicks from bubbling to Dialog overlay
          e.stopPropagation();
        }}
      >
        {/* Top bar with title and buttons */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCancel(e);
            }}
            className="h-10 w-10 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <span className="text-sm font-medium text-muted-foreground">
            Assinatura
          </span>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave(e);
            }}
            disabled={!hasSignature}
            className="h-10 w-10 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50"
          >
            <Check className="h-5 w-5" />
          </Button>
        </div>

        {/* Canvas area - takes remaining space */}
        <div className="flex-1 p-3">
          <div className="h-full w-full rounded-lg overflow-hidden bg-card border border-border relative">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair bg-white"
              style={{ touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </div>
      </div>
    );
  }

  // Collapsed clickable view
  return (
    <Card 
      className={cn("cursor-pointer hover:border-primary/50 transition-colors", className)}
      onClick={handleExpand}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center min-h-[120px] gap-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Pen className="h-6 w-6 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Toque para assinar
        </span>
        {tempSignature && (
          <span className="text-xs text-green-600 font-medium">
            ✓ Assinatura registrada
          </span>
        )}
      </CardContent>
    </Card>
  );
}
