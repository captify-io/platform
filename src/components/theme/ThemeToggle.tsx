"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useState } from "../../lib/react-compat";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "../ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-gray-800 hover:text-white p-1 cursor-pointer"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const toggleTheme = () => {
    // Use theme directly, not resolvedTheme for cycling
    const currentTheme = theme || "system";
    
    // Cycle through: system -> light -> dark -> system
    if (currentTheme === "system") {
      setTheme("light");
    } else if (currentTheme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    // Use theme for the icon display, not resolvedTheme
    const currentTheme = theme || "system";
    
    switch (currentTheme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
        return <Monitor className="h-4 w-4" />;
      default:
        // If system theme, show the resolved theme icon with monitor indicator
        if (resolvedTheme === "dark") {
          return <Monitor className="h-4 w-4" />;
        }
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="text-white hover:bg-gray-800 hover:text-white p-1 cursor-pointer"
      title={`Current theme: ${theme || "system"}. Click to cycle through system → light → dark.`}
    >
      {getIcon()}
    </Button>
  );
}
