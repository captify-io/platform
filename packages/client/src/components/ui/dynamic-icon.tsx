import { LucideIcon, icons } from "lucide-react";
import { cn } from "../../lib/utils";

// Type for all available icon names from lucide-react
export type IconName = keyof typeof icons;

interface DynamicIconProps {
  name: IconName | string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
}

/**
 * DynamicIcon component that renders lucide-react icons dynamically by name
 * Falls back to a default icon if the specified icon is not found
 */
export function DynamicIcon({ 
  name, 
  className, 
  size = 24, 
  strokeWidth = 2, 
  color, 
  style,
  ...props 
}: DynamicIconProps) {
  // Get the icon component from lucide-react icons
  const IconComponent = icons[name as IconName] || icons.Circle;
  
  return (
    <IconComponent
      className={cn("lucide", className)}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      style={style}
      {...props}
    />
  );
}
