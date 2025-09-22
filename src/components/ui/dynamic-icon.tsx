import React, { forwardRef, lazy, Suspense } from "react";
import { LucideProps } from "lucide-react";

export interface DynamicIconProps extends LucideProps {
  name: string;
  fallback?: React.ComponentType<LucideProps>;
}

// Create a component that maintains proper JSX compatibility
const DynamicIconComponent = forwardRef<SVGSVGElement, DynamicIconProps>(
  ({ name, fallback, ...props }, ref) => {
    const LucideIcon = lazy(() =>
      import("lucide-react").then((module) => ({
        default: module[name as keyof typeof module] as React.ComponentType<LucideProps>,
      }))
    );

    const Fallback = fallback || (() => null);

    return (
      <Suspense fallback={<Fallback {...props} />}>
        <LucideIcon ref={ref} {...props} />
      </Suspense>
    );
  }
);

DynamicIconComponent.displayName = "DynamicIcon";

// Export with proper JSX element type
export const DynamicIcon = DynamicIconComponent as React.FC<DynamicIconProps & React.RefAttributes<SVGSVGElement>>;