import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { SignatureCanvas } from "@/components/stock/SignatureCanvas";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title?: string;
}

export function SignatureModal({ open, onClose, onSave, title = "Assinatura" }: SignatureModalProps) {
  const [signature, setSignature] = React.useState<string | null>(null);
  const [needsCssRotation, setNeedsCssRotation] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSignature(null);
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
        setNeedsCssRotation(!lockSucceeded && !isDeviceInLandscape());
      }
    };

    lockOrientation();

    const handleOrientationChange = () => {
      setTimeout(() => {
        if (mounted) {
          setNeedsCssRotation(!isDeviceInLandscape());
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
  }, [open]);

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
      style={rotationStyle}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20 flex-shrink-0 bg-background">
        <h3 className="text-base font-semibold text-center">
          {title}
        </h3>
      </div>

      {/* Signature content */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col" style={{ minHeight: '200px' }}>
        <SignatureCanvas 
          onSignatureChange={setSignature}
          inline={true}
          className="flex-1"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 p-4 border-t border-border/20 flex-shrink-0 bg-background">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="flex-1 h-12 text-base"
        >
          <X className="h-5 w-5 mr-1" />
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
