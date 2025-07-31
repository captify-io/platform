import {
  Target,
  BarChart3,
  Search,
  Cog,
  Users,
  DollarSign,
  Shield,
  FileCheck,
  Lightbulb,
  Truck,
  UserCheck,
  Lock,
  Puzzle,
  TrendingUp,
  Grid3x3,
  GitBranch,
  Calculator,
  Layers,
  LineChart,
  Globe,
  Star,
  Clock,
  MessageSquare,
  Settings,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Target,
  BarChart3,
  Search,
  Cog,
  Users,
  DollarSign,
  Shield,
  FileCheck,
  Lightbulb,
  Truck,
  UserCheck,
  Lock,
  Puzzle,
  TrendingUp,
  Grid3x3,
  GitBranch,
  Calculator,
  Layers,
  LineChart,
  Globe,
  Star,
  Clock,
  MessageSquare,
  Settings,
};

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className = "h-4 w-4" }: DynamicIconProps) {
  const IconComponent = iconMap[name] || Puzzle; // Default to Puzzle if icon not found
  return <IconComponent className={className} />;
}
