import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  content: React.ReactNode;
  landscape?: boolean;
}

interface MobileFormWizardProps {
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  className?: string;
  /** Restore wizard step after a mobile browser reload (e.g., returning from camera). */
  initialStep?: number;
  /** Called whenever the step changes so the parent can persist it. */
  onStepChange?: (stepIndex: number) => void;
  /** Whether the form can be completed (e.g., all required fields are filled). Defaults to true. */
  canComplete?: boolean;
  /** Title shown in the header */
  headerTitle?: string;
}

export function MobileFormWizard({
  steps,
  onComplete,
  onCancel,
  isSubmitting = false,
  submitLabel = "Salvar",
  className,
  initialStep = 0,
  onStepChange,
  canComplete = true,
  headerTitle,
}: MobileFormWizardProps) {
  const clampStep = React.useCallback(
    (value: number) => Math.min(Math.max(value, 0), Math.max(steps.length - 1, 0)),
    [steps.length]
  );

  const [currentStep, setCurrentStep] = React.useState(() => clampStep(initialStep));
  const [isLandscape, setIsLandscape] = React.useState(false);
  const [needsCssRotation, setNeedsCssRotation] = React.useState(false);
  const [direction, setDirection] = React.useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = React.useState(false);

  // If steps count changes or initialStep changes (restored draft), keep it in range.
  React.useEffect(() => {
    const next = clampStep(initialStep);
    setCurrentStep(next);
  }, [initialStep, clampStep]);

  React.useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  // Handle orientation lock for landscape steps (e.g., signature)
  React.useEffect(() => {
    const shouldBeLandscape = currentStepData?.landscape ?? false;

    // Let the rest of the app know when landscape is explicitly allowed (signature step)
    const root = document.documentElement;
    if (shouldBeLandscape) root.dataset.allowLandscape = "true";
    else delete root.dataset.allowLandscape;

    let mounted = true;

    const isDeviceInLandscape = () => {
      // Check if the device is already physically in landscape
      if (screen.orientation) {
        return screen.orientation.type.includes('landscape');
      }
      return window.innerWidth > window.innerHeight;
    };

    const lockOrientation = async () => {
      try {
        if (shouldBeLandscape) {
          let lockSucceeded = false;
          
          // Try to lock to landscape using the Screen Orientation API
          if (screen.orientation && 'lock' in screen.orientation) {
            try {
              await (screen.orientation as any).lock('landscape');
              lockSucceeded = true;
            } catch {
              // Orientation lock may fail (not fullscreen, unsupported, etc.)
              lockSucceeded = false;
            }
          }

          if (mounted) {
            setIsLandscape(true);
            // Only apply CSS rotation if:
            // 1. Native lock failed AND
            // 2. Device is NOT already in landscape
            setNeedsCssRotation(!lockSucceeded && !isDeviceInLandscape());
          }
        } else {
          if (screen.orientation && 'unlock' in screen.orientation) {
            try {
              (screen.orientation as any).unlock();
            } catch {
              // ignore
            }
          }
          if (mounted) {
            setIsLandscape(false);
            setNeedsCssRotation(false);
          }
        }
      } catch {
        if (mounted) {
          setIsLandscape(shouldBeLandscape);
          setNeedsCssRotation(shouldBeLandscape && !isDeviceInLandscape());
        }
      }
    };

    lockOrientation();

    // Re-check after any orientation change
    const handleOrientationChange = () => {
      if (shouldBeLandscape) {
        // If device is now in landscape, remove CSS rotation
        setTimeout(() => {
          if (mounted) {
            setNeedsCssRotation(!isDeviceInLandscape());
          }
        }, 100);
      }
    };
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      mounted = false;
      delete document.documentElement.dataset.allowLandscape;
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (screen.orientation && 'unlock' in screen.orientation) {
        try {
          (screen.orientation as any).unlock();
        } catch {
          // ignore
        }
      }
    };
  }, [currentStep, currentStepData?.landscape]);

  const handleComplete = async () => {
    try {
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch (e) {}
    setIsLandscape(false);
    setNeedsCssRotation(false);
    await onComplete();
  };

  const handleCancel = async () => {
    try {
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch (e) {}
    setIsLandscape(false);
    setNeedsCssRotation(false);
    onCancel?.();
  };

  const handleNext = () => {
    if (!isLastStep && !isAnimating) {
      setIsAnimating(true);
      setDirection('next');
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep && !isAnimating) {
      setIsAnimating(true);
      setDirection('prev');
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  // Landscape view for signature – uses CSS rotation only when needed
  if (isLandscape) {
    // NOTE: avoid dvh/dvw here; some mobile browsers mis-handle them and can render a blank
    // fullscreen (white) overlay. Use vh/vw for reliability.
    const rotationStyle = needsCssRotation
      ? {
          transform: "rotate(90deg)",
          transformOrigin: "center center",
          width: "100vh",
          height: "100vw",
          left: "calc(50% - 50vh)",
          top: "calc(50% - 50vw)",
          position: "fixed" as const,
        }
      : {};

    const renderedContent = React.useMemo(() => {
      // If the step content is a React element (e.g., SignatureCanvas), inject isRotated so
      // pointer coordinates match the finger when CSS rotation is applied.
      if (React.isValidElement(currentStepData?.content)) {
        return React.cloneElement(currentStepData.content as React.ReactElement<any>, {
          isRotated: needsCssRotation,
        });
      }
      return currentStepData?.content;
    }, [currentStepData?.content, needsCssRotation]);

    return (
      <div 
        className={cn(
          // Fixed fullscreen container
          "fixed inset-0 z-[9999] bg-background flex flex-col",
          "landscape-locked",
          className
        )}
        style={{ ...rotationStyle, touchAction: "none" }}
      >
        {/* Simple title */}
        <div className="px-4 py-3 border-b border-border/20 flex-shrink-0 bg-background">
          <h3 className="text-base font-semibold text-center">
            {currentStepData?.title}
          </h3>
        </div>

        {/* Signature content - fills available space */}
        <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
          {renderedContent}
        </div>

        {/* Simple Cancel/Save buttons */}
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
            onClick={handleComplete}
            disabled={isSubmitting || !canComplete}
            className="flex-1 h-12 text-base"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-1" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex flex-col h-full min-h-0",
        className
      )}
    >
      {/* Header with title and close button */}
      {headerTitle && (
        <div className="bg-primary px-4 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-primary-foreground">
            {headerTitle}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">
          Passo {currentStep + 1} de {steps.length}
        </span>
        <div className="flex gap-1.5">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-6 h-2.5 bg-primary"
                  : index < currentStep
                  ? "w-2.5 h-2.5 bg-primary/60"
                  : "w-2.5 h-2.5 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step title */}
      <div className="px-4 py-4 border-b border-border">
        <h3 
          className={cn(
            "text-base font-semibold text-center transition-all duration-200",
            isAnimating && "opacity-0"
          )}
        >
          {currentStepData?.title}
        </h3>
      </div>

      {/* Step content */}
      <div 
        className={cn(
          "flex-1 min-h-0 overflow-y-auto p-4 transition-all duration-200",
          isAnimating && "opacity-0"
        )}
      >
        {currentStepData?.content}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-3 p-4 border-t border-border bg-background flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={isFirstStep ? handleCancel : handlePrevious}
          disabled={isAnimating}
          className="flex-1 h-12 text-base font-medium"
        >
          {isFirstStep ? 'Cancelar' : 'Voltar'}
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isSubmitting || !canComplete}
            className="flex-1 h-12 text-base font-medium"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                {submitLabel}
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isAnimating}
            className="flex-1 h-12 text-base font-medium"
          >
            Próximo
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
