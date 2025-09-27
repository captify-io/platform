"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useState } from "../../lib/react-compat";
import { Palette, Sun, Moon, Check } from "lucide-react";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { themes, type ThemeName } from "./themes";
import { useFavorites } from "../../hooks/useFavorites";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { userTheme, saveTheme } = useFavorites();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user's saved theme on mount
  useEffect(() => {
    if (mounted && userTheme && userTheme !== theme) {
      setTheme(userTheme);
    }
  }, [mounted, userTheme, theme, setTheme]);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-foreground hover:bg-accent hover:text-accent-foreground p-1 cursor-pointer"
      >
        <Palette className="h-4 w-4" />
      </Button>
    );
  }

  const handleThemeSelect = async (themeName: ThemeName) => {
    setTheme(themeName);
    await saveTheme(themeName);
    setOpen(false);
  };

  const getIcon = () => {
    const currentTheme = theme || "captify";

    switch (currentTheme) {
      case "lite":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "captify":
      default:
        return <Palette className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-foreground hover:bg-accent hover:text-accent-foreground p-1 cursor-pointer"
          title={`Current theme: ${themes[theme as keyof typeof themes]?.name || "Captify"}`}
        >
          {getIcon()}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        <div className="space-y-1">
          <div className="text-sm font-medium px-2 py-1">Choose theme</div>
          {Object.entries(themes).map(([key, themeConfig]) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className="w-full justify-between h-8"
              onClick={() => handleThemeSelect(key as ThemeName)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: themeConfig.colors.primary }}
                />
                <span>{themeConfig.name}</span>
              </div>
              {theme === key && <Check className="h-3 w-3" />}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
