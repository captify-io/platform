"use client";

import React from "react";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/input";

interface SearchResult {
  title: string;
  description: string;
  href: string;
  type: string;
}

interface GlobalSearchProps {
  className?: string;
  onFocus?: () => void;
}

export function GlobalSearch({ className, onFocus }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocus}
          className="pl-9 bg-muted/50"
        />
      </div>
    </div>
  );
}
