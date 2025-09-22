import { DynamicIcon as LucideDynamicIcon } from "lucide-react/dynamic";
import { ComponentProps } from "react";

// Re-export the DynamicIcon with proper types
export { LucideDynamicIcon as DynamicIcon };

// Create a proper type for DynamicIcon props
export type DynamicIconProps = ComponentProps<typeof LucideDynamicIcon>;