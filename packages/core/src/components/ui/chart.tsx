"use client";

import React from "react";

export interface ChartColorConfig {
  label: string;
  color: string;
}

export type ChartConfigMap = Record<string, ChartColorConfig>;

interface ChartContainerProps {
  config?: ChartConfigMap;
  className?: string;
  children: React.ReactNode;
}

export function ChartContainer({
  config,
  className,
  children,
}: ChartContainerProps) {
  const style: React.CSSProperties = {};
  if (config) {
    Object.entries(config).forEach(([key, value]) => {
      (style as Record<string, string>)[`--chart-${key}`] = value.color;
    });
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function ChartLegend({ children }: { children?: React.ReactNode }) {
  return <div className="mt-2 text-xs text-muted-foreground">{children}</div>;
}

export function ChartTooltip({ children }: { children?: React.ReactNode }) {
  return <div className="text-xs">{children}</div>;
}
