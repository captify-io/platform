import React, { Suspense, lazy, Component, ErrorInfo, ReactNode } from "react";
import { LucideProps, Circle } from "lucide-react";

export interface DynamicIconProps extends LucideProps {
  name: string;
  fallback?: React.ComponentType<any>;
  suppressErrors?: boolean;
}

// Error boundary to catch icon loading errors
interface ErrorBoundaryState {
  hasError: boolean;
}

class IconErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; suppressErrors?: boolean },
  ErrorBoundaryState
> {
  constructor(props: {
    children: ReactNode;
    fallback: ReactNode;
    suppressErrors?: boolean;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.suppressErrors !== false) {
      // Suppress the error by not rethrowing it
      console.warn(
        "[DynamicIcon]: Icon loading failed, using fallback",
        error.message
      );
    } else {
      console.error("[DynamicIcon]: Icon loading failed", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Icon name mapping for common variations
const iconNameMap: Record<string, string> = {
  // Common mappings
  dashboard: "layout-dashboard",
  users: "users",
  user: "user",
  settings: "settings",
  cog: "settings",
  gear: "settings",
  home: "home",
  house: "home",
  package: "package",
  box: "package",
  database: "database",
  data: "database",
  server: "server",
  cloud: "cloud",
  code: "code",
  cpu: "cpu",
  processor: "cpu",
  monitor: "monitor",
  screen: "monitor",
  analytics: "bar-chart-3",
  chart: "bar-chart-3",
  reports: "file-text",
  report: "file-text",
  security: "shield",
  shield: "shield",
  access: "key",
  key: "key",
  tools: "wrench",
  wrench: "wrench",
  help: "help-circle",
  support: "help-circle",
  logout: "log-out",
  signin: "log-in",
  search: "search",
  filter: "filter",
  menu: "menu",
  bars: "menu",
  hamburger: "menu",
  close: "x",
  cancel: "x",
  delete: "trash-2",
  trash: "trash-2",
  edit: "edit",
  pencil: "edit",
  add: "plus",
  plus: "plus",
  create: "plus",
  minus: "minus",
  remove: "minus",
  check: "check",
  tick: "check",
  star: "star",
  favorite: "star",
  heart: "heart",
  like: "heart",
  bell: "bell",
  notification: "bell",
  mail: "mail",
  email: "mail",
  message: "message-square",
  chat: "message-square",
  phone: "phone",
  calendar: "calendar",
  date: "calendar",
  clock: "clock",
  time: "clock",
  globe: "globe",
  world: "globe",
  link: "link",
  external: "external-link",
  download: "download",
  upload: "upload",
  file: "file",
  document: "file-text",
  folder: "folder",
  directory: "folder",
  image: "image",
  photo: "image",
  video: "video",
  play: "play",
  pause: "pause",
  stop: "square",
  refresh: "refresh-cw",
  reload: "refresh-cw",
  sync: "refresh-cw",
  wifi: "wifi",
  network: "wifi",
  bluetooth: "bluetooth",
  battery: "battery",
  power: "power",
};

// Normalize icon name (lowercase, replace spaces/underscores with hyphens)
function normalizeIconName(name: string): string {
  if (!name) return "circle";

  const normalized = name
    .toLowerCase()
    .replace(/[\s_]/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  // Check if we have a mapping for this name
  return iconNameMap[normalized] || normalized;
}

// Dynamically import the official DynamicIcon component
// @ts-ignore - DynamicIcon is available but may not have proper TS exports yet
const DynamicIconComponent = lazy(
  () => import("lucide-react/dist/esm/DynamicIcon.js")
);

// Create a properly typed wrapper for the official DynamicIcon
export const DynamicIcon = React.forwardRef<SVGSVGElement, DynamicIconProps>(
  ({ name, fallback, suppressErrors = true, ...props }, ref) => {
    const normalizedName = normalizeIconName(name);
    const FallbackIcon = fallback || Circle;

    const fallbackElement = <FallbackIcon {...props} ref={ref} />;

    return (
      <IconErrorBoundary
        fallback={fallbackElement}
        suppressErrors={suppressErrors}
      >
        <Suspense
          fallback={
            <div
              className="animate-pulse rounded-full bg-current opacity-30"
              style={{
                width: props.size ?? 24,
                height: props.size ?? 24,
              }}
            />
          }
        >
          <DynamicIconComponent {...props} name={normalizedName} ref={ref} />
        </Suspense>
      </IconErrorBoundary>
    );
  }
);

DynamicIcon.displayName = "DynamicIcon";
