import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-border/30 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-md)]",
        elevated: "border-border/20 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5",
        glass: "border-white/10 bg-card/80 backdrop-blur-sm shadow-[var(--shadow-md)]",
        gradient: "border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lg)] hover:border-primary/30",
        interactive: "border-border/30 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lg)] hover:border-primary/40 hover:-translate-y-1 cursor-pointer",
        stat: "border-border/20 bg-gradient-to-br from-card to-muted/30 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:scale-[1.02] cursor-pointer",
        dashboard: "relative overflow-hidden border-border/20 bg-gradient-to-br from-card via-card to-primary/[0.02] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lg)] hover:border-primary/50 hover:-translate-y-1.5 cursor-pointer before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/0 before:to-primary/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 group",
        folded: "relative border-border/30 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-md)] rounded-tr-none",
      },
      folded: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      folded: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  folded?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, folded = false, children, ...props }, ref) => {
    if (folded) {
      return (
        <div className="relative">
          {/* Folded corner - positioned outside the card */}
          <div 
            className="absolute -top-0 -right-0 w-10 h-10 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {/* The fold triangle (dark part that looks like the back of the page) */}
            <div 
              className="absolute top-0 right-0 w-10 h-10"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 50%, transparent 50%)',
              }}
            />
            {/* Shadow under the fold */}
            <div 
              className="absolute top-0 right-0 w-10 h-10"
              style={{
                background: 'linear-gradient(135deg, transparent 45%, rgba(0,0,0,0.1) 50%, transparent 55%)',
              }}
            />
          </div>
          <div
            ref={ref}
            className={cn(
              cardVariants({ variant, className }),
              "rounded-tr-none"
            )}
            style={{ clipPath: 'polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 0 100%)' }}
            {...props}
          >
            {children}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
