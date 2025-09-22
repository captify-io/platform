import { ComponentProps, forwardRef, lazy, Suspense } from "react";
import { LucideProps } from "lucide-react";

// Create our own DynamicIcon implementation that doesn't rely on external exports
export interface DynamicIconProps extends LucideProps {
  name: string;
  fallback?: React.ComponentType<LucideProps>;
}

export const DynamicIcon = forwardRef<SVGSVGElement, DynamicIconProps>(
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

DynamicIcon.displayName = "DynamicIcon";