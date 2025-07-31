"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationLayout } from "@/components/layout/ApplicationLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts";

// Data for charts
const fleetStatusData = [
  { name: "Mission Ready", value: 42, percentage: 87.5, color: "#10b981" },
  { name: "Critical MICAPs", value: 12, percentage: 25.0, color: "#ef4444" },
  { name: "Maintenance", value: 8, percentage: 16.7, color: "#f59e0b" },
  { name: "Non-Critical", value: 4, percentage: 8.3, color: "#6b7280" },
];

const micapTrendData = [
  { month: "Jan", critical: 15, nonCritical: 8, resolved: 12 },
  { month: "Feb", critical: 18, nonCritical: 6, resolved: 15 },
  { month: "Mar", critical: 12, nonCritical: 9, resolved: 18 },
  { month: "Apr", critical: 16, nonCritical: 7, resolved: 14 },
  { month: "May", critical: 14, nonCritical: 5, resolved: 16 },
  { month: "Jun", critical: 12, nonCritical: 4, resolved: 18 },
];

const availabilityData = [
  { day: "Mon", availability: 85, target: 90 },
  { day: "Tue", availability: 88, target: 90 },
  { day: "Wed", availability: 82, target: 90 },
  { day: "Thu", availability: 90, target: 90 },
  { day: "Fri", availability: 87, target: 90 },
  { day: "Sat", availability: 92, target: 90 },
  { day: "Sun", availability: 89, target: 90 },
];

const partsCategoryData = [
  { category: "Engine", issues: 15, resolved: 8 },
  { category: "Hydraulic", issues: 12, resolved: 7 },
  { category: "Avionics", issues: 8, resolved: 6 },
  { category: "Landing Gear", issues: 6, resolved: 4 },
  { category: "Other", issues: 10, resolved: 8 },
];

// Weapon Systems data
const weaponSystems = [
  { value: "b52-stratofortress", label: "B-52 Stratofortress" },
  { value: "f22-raptor", label: "F-22 Raptor" },
  { value: "f35-lightning", label: "F-35 Lightning II" },
  { value: "f16-falcon", label: "F-16 Fighting Falcon" },
  { value: "a10-thunderbolt", label: "A-10 Thunderbolt II" },
  { value: "b2-spirit", label: "B-2 Spirit" },
];

// Problem Parts Table data with supply chain metrics
const problemPartsData = [
  {
    partNumber: "5365-01-234-5678",
    description: "Engine Mount Assembly",
    system: "Propulsion",
    criticality: "Critical",
    onHandQty: 2,
    requiredQty: 8,
    leadTime: "120 days",
    reliability: "72%",
    avgFailureRate: "8.2/1000hrs",
    lastFailure: "14 days ago",
    supplier: "Lockheed Martin",
    cost: "$45,000",
    stockStatus: "Critical Low"
  },
  {
    partNumber: "1650-01-987-6543",
    description: "Hydraulic Pump",
    system: "Hydraulics",
    criticality: "Critical",
    onHandQty: 1,
    requiredQty: 6,
    leadTime: "95 days",
    reliability: "68%",
    avgFailureRate: "12.5/1000hrs",
    lastFailure: "7 days ago",
    supplier: "Boeing",
    cost: "$28,500",
    stockStatus: "Critical Low"
  },
  {
    partNumber: "5841-01-456-7890",
    description: "Flight Control Computer",
    system: "Avionics",
    criticality: "Critical",
    onHandQty: 3,
    requiredQty: 5,
    leadTime: "180 days",
    reliability: "85%",
    avgFailureRate: "3.1/1000hrs",
    lastFailure: "21 days ago",
    supplier: "Raytheon",
    cost: "$125,000",
    stockStatus: "Low"
  },
  {
    partNumber: "1620-01-123-4567",
    description: "Landing Gear Strut",
    system: "Landing Gear",
    criticality: "High",
    onHandQty: 0,
    requiredQty: 4,
    leadTime: "150 days",
    reliability: "79%",
    avgFailureRate: "5.8/1000hrs",
    lastFailure: "35 days ago",
    supplier: "Goodrich",
    cost: "$35,000",
    stockStatus: "Out of Stock"
  },
  {
    partNumber: "2840-01-345-6789",
    description: "Turbine Blade Set",
    system: "Propulsion",
    criticality: "Critical",
    onHandQty: 4,
    requiredQty: 12,
    leadTime: "200 days",
    reliability: "91%",
    avgFailureRate: "2.3/1000hrs",
    lastFailure: "45 days ago",
    supplier: "Pratt & Whitney",
    cost: "$85,000",
    stockStatus: "Low"
  }
];

export default function ConsolePage() {
  const [selectedWeaponSystem, setSelectedWeaponSystem] = useState("b52-stratofortress");
  const [chatSubmitFunction, setChatSubmitFunction] = useState<((message: string) => void) | null>(null);

  const handlePartClick = (part: typeof problemPartsData[0]) => {
    const message = `Tell me about the supply chain issue with ${part.description} (Part: ${part.partNumber}). Current status: ${part.stockStatus}, Stock: ${part.onHandQty}/${part.requiredQty}, Reliability: ${part.reliability}, Lead Time: ${part.leadTime}, Supplier: ${part.supplier}`;
    
    // Submit to chat using the callback function
    if (chatSubmitFunction) {
      chatSubmitFunction(message);
    }
  };

  const handleChartClick = (data: any, chartType: string) => {
    let message = '';
    
    switch (chartType) {
      case 'fleet-status':
        message = `Analyze the ${data.name} status showing ${data.value} aircraft (${data.percentage}%). What are the key factors affecting this metric?`;
        break;
      case 'micap-trend':
        message = `Explain the MICAP trend for ${data.month} with ${data.critical} critical issues, ${data.nonCritical} non-critical, and ${data.resolved} resolved. What actions should be prioritized?`;
        break;
      case 'availability':
        message = `Review the ${data.day} availability at ${data.availability}% vs target ${data.target}%. How can we improve this performance?`;
        break;
      case 'parts-category':
        message = `Analyze ${data.category} parts issues: ${data.issues} open issues, ${data.resolved} resolved. What's driving these problems?`;
        break;
    }
    
    // Submit to chat using the callback function
    if (chatSubmitFunction) {
      chatSubmitFunction(message);
    }
  };
  return (
    <ApplicationLayout
      applicationName="Aircraft Readiness Assistant"
      applicationId="aircraft-console"
      chatWelcomeMessage="Hello! I'm your Aircraft Readiness Assistant. I can help you with aircraft status, maintenance schedules, parts availability, and MICAP issues. What would you like to know?"
      chatPlaceholder="Ask about aircraft status, MICAPs, parts..."
      showChat={true}
      chatWidth={420}
      onChatReady={setChatSubmitFunction}
    >
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header Section with Weapon System Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Aircraft Readiness Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Real-time aircraft status and maintenance overview
              </p>
            </div>
            <div className="w-64">
              <Select value={selectedWeaponSystem} onValueChange={setSelectedWeaponSystem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select weapon system" />
                </SelectTrigger>
                <SelectContent>
                  {weaponSystems.map((system) => (
                    <SelectItem key={system.value} value={system.value}>
                      {system.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Problem Parts Table */}
          <div className="col-span-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Critical Supply Chain Issues</CardTitle>
                <p className="text-sm text-gray-600">Click any row to automatically send details to AI for analysis</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Part Number</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Stock</TableHead>
                      <TableHead className="text-xs">Reliability</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problemPartsData.map((part, index) => (
                      <TableRow 
                        key={index} 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handlePartClick(part)}
                      >
                        <TableCell className="font-mono text-xs">{part.partNumber}</TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{part.description}</div>
                          <div className="text-gray-500">{part.system}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{part.onHandQty}/{part.requiredQty}</div>
                          <div className="text-gray-500">{part.leadTime}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className={`font-medium ${part.reliability < "75%" ? "text-red-600" : part.reliability < "85%" ? "text-orange-600" : "text-green-600"}`}>
                            {part.reliability}
                          </div>
                          <div className="text-gray-500">{part.avgFailureRate}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={part.stockStatus === "Out of Stock" || part.stockStatus === "Critical Low" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {part.stockStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Dashboard */}
          <div className="col-span-7 space-y-6">{/* Aircraft Readiness Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">42</div>
              <p className="text-sm text-gray-500 mb-3">Ready (87.5%)</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "87.5%" }}
                ></div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-4xl font-bold text-red-600 mb-2">12</div>
              <p className="text-sm text-gray-500 mb-3">Critical MICAPs</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: "25%" }}
                ></div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">89%</div>
              <p className="text-sm text-gray-500 mb-3">Parts Available</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "89%" }}
                ></div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-4xl font-bold text-orange-600 mb-2">7</div>
              <p className="text-sm text-gray-500 mb-3">Maint Due</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: "35%" }}
                ></div>
              </div>
            </Card>
          </div>

          {/* Charts Row - Cleaner Layout */}
          <div className="space-y-6">
            {/* Top Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Fleet Status Pie Chart */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-800">Fleet Status Distribution</CardTitle>
                  <p className="text-sm text-gray-600">Click segments to send data to AI for analysis</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={fleetStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        onClick={(data) => handleChartClick(data, 'fleet-status')}
                        className="cursor-pointer"
                      >
                        {fleetStatusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            className="hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value} aircraft (${props.payload.percentage}%)`,
                          props.payload.name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* MICAP Trends */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-800">MICAP Trends (6 Months)</CardTitle>
                  <p className="text-sm text-gray-600">Click buttons to send trend data to AI</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={micapTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="critical" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        name="Critical Issues"
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 5, cursor: 'pointer' }}
                        activeDot={{ r: 7, stroke: '#ef4444', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="resolved" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="Resolved Issues"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5, cursor: 'pointer' }}
                        activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="nonCritical" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Non-Critical"
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4, cursor: 'pointer' }}
                        activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Clickable trend data buttons */}
                  <div className="grid grid-cols-6 gap-1 mt-2">
                    {micapTrendData.map((data, index) => (
                      <button
                        key={index}
                        onClick={() => handleChartClick(data, 'micap-trend')}
                        className="text-xs p-1 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                      >
                        <div className="font-medium">{data.month}</div>
                        <div className="text-red-600">{data.critical} crit</div>
                        <div className="text-green-600">{data.resolved} res</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Weekly Availability */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-800">Weekly Aircraft Availability</CardTitle>
                  <p className="text-sm text-gray-600">Click buttons to send availability data to AI</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={availabilityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        domain={[75, 100]} 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip
                        formatter={(value, name) => [`${value}%`, name === "availability" ? "Actual" : "Target"]}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="availability" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                        name="Actual Availability"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Target (90%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  {/* Clickable overlay for availability data */}
                  <div className="grid grid-cols-7 gap-1 mt-2">
                    {availabilityData.map((data, index) => (
                      <button
                        key={index}
                        onClick={() => handleChartClick(data, 'availability')}
                        className="text-xs p-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        {data.day}: {data.availability}%
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Parts Issues by Category */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-800">Parts Issues by Category</CardTitle>
                  <p className="text-sm text-gray-600">Click buttons to send category data to AI</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={partsCategoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="issues" 
                        fill="#ef4444" 
                        name="Open Issues"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar 
                        dataKey="resolved" 
                        fill="#10b981" 
                        name="Resolved"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Clickable category buttons */}
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {partsCategoryData.map((data, index) => (
                      <button
                        key={index}
                        onClick={() => handleChartClick(data, 'parts-category')}
                        className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                      >
                        <div className="font-medium">{data.category}</div>
                        <div className="text-red-600">{data.issues} issues</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}
