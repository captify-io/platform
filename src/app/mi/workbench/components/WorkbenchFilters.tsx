"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicIcon } from "lucide-react/dynamic";

interface WorkbenchFiltersProps {
  statusFilter: string;
  priorityFilter: string;
  searchTerm: string;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function WorkbenchFilters({
  statusFilter,
  priorityFilter,
  searchTerm,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onRefresh,
  loading = false,
}: WorkbenchFiltersProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DynamicIcon name="filter" className="h-5 w-5" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search issues, parts, or descriptions..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Analyze">Analyze</SelectItem>
                <SelectItem value="Validate Solution">Validate Solution</SelectItem>
                <SelectItem value="Qualify">Qualify</SelectItem>
                <SelectItem value="Field">Field</SelectItem>
                <SelectItem value="Monitor">Monitor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="w-full lg:w-48">
            <Select value={priorityFilter} onValueChange={onPriorityChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="w-full lg:w-auto"
          >
            <DynamicIcon 
              name={loading ? "loader-2" : "refresh-cw"} 
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} 
            />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
