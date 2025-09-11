export * from './agent';

// Common types for components
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface BaseState {
  loading?: boolean;
  error?: string | null;
}