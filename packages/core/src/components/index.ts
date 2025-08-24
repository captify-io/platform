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
export * from "./search";

// Navigation Components
export * from "./navigation";

// App Management Components (consolidated from @captify/appman)
export { AppLayout } from "./AppLayout";
export { AppMarket } from "./AppMarket";
export { ApplicationLauncher } from "./ApplicationLauncher";
export { FavoritesBar } from "./navigation/FavoritesBar";

// Chat Components
export { ResizableChatPanel } from "./ChatLayout";

// Chat components from chat package integration
export {
  ChatInterface,
  ChatContent,
  ChatHeader,
  ChatFooter,
  ChatSettings,
  ChatHistory,
  ThreadList,
  ThreadPanelHeader,
  ContextPanel,
  ToolsPanel,
  ReasoningPanel,
  ChatLayout,
  ConsoleLayout,
} from "../chat";

export type {
  ChatInterfaceProps,
  ConversationSummary,
  Provider,
} from "../chat";

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

// Page Components
export * from "./pages";
