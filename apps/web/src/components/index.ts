// UI Components
export * from "./ui/alert-dialog";
export * from "./ui/alert";
export * from "./ui/avatar";
export * from "./ui/badge";
export * from "./ui/breadcrumb";
export * from "./ui/button";
export * from "./ui/card";
export * from "./ui/chart";
export * from "./ui/dropdown-menu";
export * from "./ui/input";
export * from "./ui/label";
export * from "./ui/progress";
export * from "./ui/scroll-area";
export * from "./ui/select";
export * from "./ui/separator";
export * from "./ui/sheet";
export * from "./ui/sidebar";
export * from "./ui/skeleton";
export * from "./ui/table";
export * from "./ui/tabs";
export * from "./ui/textarea";
export * from "./ui/tooltip";

// Search Components
export * from "./search/index";

// Navigation Components
export * from "./navigation/index";

// App Management Components (consolidated from @captify/appman)
export { AppLayout } from "./AppLayout";
export { AppMarket } from "./AppMarket";
export { ApplicationLauncher } from "./ApplicationLauncher";
export { FavoritesBar } from "./navigation/FavoritesBar";

// Theme Components
export * from "./theme/ThemeToggle";

// Chart Components
export * from "./charts/DynamicChart";

// Loading Components
export { LoadingScreen } from "./navigation/LoadingScreen";

// Utility Components
export { SmartBreadcrumb } from "./navigation/SmartBreadcrumb";
export { TopNavigation } from "./navigation/TopNavigation";
export * from "./navigation/LoadingScreen";

// Panel Components
export { ResizablePanel, ResizableChatPanel } from "./ResizablePanel";

// Page Components
export * from "./pages/index";

// Utility functions
export * from "../lib/utils";

// Re-export common utilities for components
export { cva, type VariantProps } from "class-variance-authority";
export { DynamicIcon, type IconName } from "./ui/dynamic-icon";
