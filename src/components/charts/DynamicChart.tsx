"use client";

import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Chart type definitions
export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "pie"
  | "scatter"
  | "radar"
  | "column"
  | "donut"
  | "trading_watchlist"
  | "trading_chart"
  | "performance_tiles"
  | "volume_chart";

// Chart configuration interface
interface ChartConfig {
  type: ChartType;
  title: string;
  data: Record<string, unknown>[];
  xKey?: string;
  yKey?: string;
  yKeys?: string[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
}

// Default color palette
const DEFAULT_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c7c",
  "#8dd1e1",
  "#d084d0",
  "#ffb347",
  "#87ceeb",
  "#deb887",
  "#f0e68c",
];

// Chart component implementations
const renderLineChart = (config: ChartConfig) => (
  <ResponsiveContainer width="100%" height={config.height || 300}>
    <LineChart data={config.data}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xKey || "name"} />
      <YAxis />
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
      {config.yKeys ? (
        config.yKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={
              config.colors?.[index] ||
              DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
            strokeWidth={2}
          />
        ))
      ) : (
        <Line
          type="monotone"
          dataKey={config.yKey || "value"}
          stroke={config.colors?.[0] || DEFAULT_COLORS[0]}
          strokeWidth={2}
        />
      )}
    </LineChart>
  </ResponsiveContainer>
);

const renderAreaChart = (config: ChartConfig) => (
  <ResponsiveContainer width="100%" height={config.height || 300}>
    <AreaChart data={config.data}>
      <defs>
        {(config.yKeys && config.yKeys.length > 0
          ? config.yKeys
          : [config.yKey || "value"]
        ).map((key, index) => {
          const color =
            config.colors?.[index] ||
            DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          const gradientId = `areaGradient-${index}`;
          return (
            <linearGradient
              key={gradientId}
              id={gradientId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          );
        })}
      </defs>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xKey || "name"} />
      <YAxis />
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
      {config.yKeys ? (
        config.yKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={
              config.colors?.[index] ||
              DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
            fill={`url(#areaGradient-${index})`}
          />
        ))
      ) : (
        <Area
          type="monotone"
          dataKey={config.yKey || "value"}
          stroke={config.colors?.[0] || DEFAULT_COLORS[0]}
          fill={`url(#areaGradient-0)`}
        />
      )}
    </AreaChart>
  </ResponsiveContainer>
);

const renderBarChart = (config: ChartConfig) => (
  <ResponsiveContainer width="100%" height={config.height || 300}>
    <BarChart data={config.data}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xKey || "name"} />
      <YAxis />
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
      {config.yKeys ? (
        config.yKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={
              config.colors?.[index] ||
              DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
          />
        ))
      ) : (
        <Bar
          dataKey={config.yKey || "value"}
          fill={config.colors?.[0] || DEFAULT_COLORS[0]}
        />
      )}
    </BarChart>
  </ResponsiveContainer>
);

const renderPieChart = (config: ChartConfig) => (
  <ResponsiveContainer width="100%" height={config.height || 300}>
    <PieChart>
      <Pie
        data={config.data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) =>
          `${name} ${((percent || 0) * 100).toFixed(0)}%`
        }
        outerRadius={80}
        fill="#8884d8"
        dataKey={config.yKey || "value"}
      >
        {config.data.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={
              config.colors?.[index] ||
              DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
          />
        ))}
      </Pie>
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
    </PieChart>
  </ResponsiveContainer>
);

const renderScatterChart = (config: ChartConfig) => (
  <ResponsiveContainer width="100%" height={config.height || 300}>
    <ScatterChart data={config.data}>
      {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
      <XAxis dataKey={config.xKey || "x"} />
      <YAxis dataKey={config.yKey || "y"} />
      {config.showTooltip && <Tooltip cursor={{ strokeDasharray: "3 3" }} />}
      {config.showLegend && <Legend />}
      <Scatter fill={config.colors?.[0] || DEFAULT_COLORS[0]} />
    </ScatterChart>
  </ResponsiveContainer>
);

const renderRadarChart = (config: ChartConfig) => (
  <ResponsiveContainer width="100%" height={config.height || 300}>
    <RadarChart data={config.data}>
      <PolarGrid />
      <PolarAngleAxis dataKey={config.xKey || "subject"} />
      <PolarRadiusAxis />
      {config.yKeys ? (
        config.yKeys.map((key, index) => (
          <Radar
            key={key}
            name={key}
            dataKey={key}
            stroke={
              config.colors?.[index] ||
              DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
            fill={
              config.colors?.[index] ||
              DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
            fillOpacity={0.6}
          />
        ))
      ) : (
        <Radar
          name="Value"
          dataKey={config.yKey || "value"}
          stroke={config.colors?.[0] || DEFAULT_COLORS[0]}
          fill={config.colors?.[0] || DEFAULT_COLORS[0]}
          fillOpacity={0.6}
        />
      )}
      {config.showTooltip && <Tooltip />}
      {config.showLegend && <Legend />}
    </RadarChart>
  </ResponsiveContainer>
);

// Trading interface chart implementations
const renderTradingWatchlist = (config: ChartConfig) => {
  // Ensure config.data is an array
  const dataArray = Array.isArray(config.data) ? config.data : [];

  return (
    <div className="space-y-2 h-full overflow-y-auto">
      {dataArray.map((item: Record<string, unknown>, index: number) => {
        const typedItem = item as {
          part_code?: string;
          part_name?: string;
          last_price?: number;
          percent_change?: number;
          trend_direction?: string;
        };
        return (
          <div
            key={index}
            className={`flex justify-between items-center p-2 rounded border-l-4 cursor-pointer hover:bg-gray-50 ${
              typedItem.trend_direction === "up"
                ? "border-green-500"
                : typedItem.trend_direction === "down"
                ? "border-red-500"
                : "border-gray-400"
            }`}
          >
            <div>
              <div className="font-semibold text-sm">{typedItem.part_code}</div>
              <div className="text-xs text-gray-600 truncate">
                {typedItem.part_name}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm">
                {typedItem.last_price?.toFixed(2)}
              </div>
              <div
                className={`text-xs ${
                  (typedItem.percent_change ?? 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {(typedItem.percent_change ?? 0) >= 0 ? "+" : ""}
                {typedItem.percent_change?.toFixed(1)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const renderTradingChart = (config: ChartConfig) => {
  const chartData = Array.isArray(config.data)
    ? config.data
    : ((config.data as Record<string, unknown>)?.price_data as Record<
        string,
        unknown
      >[]) || [];

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="70%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#8884d8"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height="30%">
        <BarChart data={chartData}>
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Bar dataKey="volume" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const renderPerformanceTiles = (config: ChartConfig) => {
  // Handle case where config.data might be an array or object
  const dataToProcess = Array.isArray(config.data)
    ? { performance: config.data }
    : config.data || {};

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {Object.entries(dataToProcess).map(
        ([timeframe, items]: [string, unknown]) => {
          // Ensure items is an array
          const itemsArray = Array.isArray(items) ? items : [];

          return (
            <div key={timeframe}>
              <h4 className="font-semibold text-sm mb-2 capitalize">
                {timeframe.replace("_", " ")}
              </h4>
              <div className="space-y-1">
                {itemsArray.map(
                  (item: Record<string, unknown>, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 rounded bg-gray-50"
                    >
                      <span className="text-sm font-mono">
                        {item.part_code as string}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          (item.performance as number) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(item.performance as number) >= 0 ? "+" : ""}
                        {(item.performance as number)?.toFixed(1)}%
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
};

const renderVolumeChart = (config: ChartConfig) => {
  // Ensure config.data is an array
  const dataArray = Array.isArray(config.data) ? config.data : [];

  return (
    <ResponsiveContainer width="100%" height={config.height || 200}>
      <BarChart data={dataArray}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="volume" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Main DynamicChart component
interface DynamicChartProps {
  config: ChartConfig;
  className?: string;
}

export function DynamicChart({ config, className }: DynamicChartProps) {
  const renderChart = () => {
    switch (config.type) {
      case "line":
        return renderLineChart(config);
      case "area":
        return renderAreaChart(config);
      case "bar":
      case "column":
        return renderBarChart(config);
      case "pie":
      case "donut":
        return renderPieChart(config);
      case "scatter":
        return renderScatterChart(config);
      case "radar":
        return renderRadarChart(config);
      case "trading_watchlist":
        return renderTradingWatchlist(config);
      case "trading_chart":
        return renderTradingChart(config);
      case "performance_tiles":
        return renderPerformanceTiles(config);
      case "volume_chart":
        return renderVolumeChart(config);
      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Unsupported chart type: {config.type}
          </div>
        );
    }
  };

  return (
    <Card className={`h-full ${className || ""}`}>
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {config.data && config.data.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available for chart
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utility function to transform API data for charts
export function transformDataForChart(
  data: Record<string, unknown>[],
  chartType: ChartType,
  xKey: string,
  yKey: string | string[]
): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];

  switch (chartType) {
    case "pie":
    case "donut":
      // For pie charts, ensure we have name and value fields
      return data.map((item) => ({
        name: item[xKey] || item.name,
        value: Array.isArray(yKey) ? item[yKey[0]] : item[yKey] || item.value,
      }));

    case "line":
    case "area":
    case "bar":
    case "column":
      // For line/area/bar charts, preserve original structure
      return data;

    case "scatter":
      // For scatter plots, ensure x and y fields
      return data.map((item) => ({
        x: item[xKey] || item.x,
        y: Array.isArray(yKey) ? item[yKey[0]] : item[yKey] || item.y,
        ...item,
      }));

    case "radar":
      // For radar charts, group by subject
      return data;

    case "trading_watchlist":
    case "trading_chart":
    case "performance_tiles":
    case "volume_chart":
      // For trading interface charts, preserve original structure
      return data;

    default:
      return data;
  }
}

export default DynamicChart;
