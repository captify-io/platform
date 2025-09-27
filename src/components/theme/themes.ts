export const themes = {
  captify: {
    name: "Captify",
    description: "Royal dark blue premium theme",
    colors: {
      // Brand Colors (Royal dark blue palette)
      primary: "oklch(0.708 0.142 264.376)", // Bright royal blue for contrast
      "primary-foreground": "oklch(0.125 0.048 264.376)", // Dark blue text
      secondary: "oklch(0.828 0.096 264.376)", // Light royal blue
      "secondary-foreground": "oklch(0.125 0.048 264.376)",

      // Functional Colors (Adjusted for dark royal background)
      success: "oklch(0.696 0.142 164.285)", // Bright green for visibility
      warning: "oklch(0.828 0.142 70.08)", // Bright amber
      error: "oklch(0.758 0.142 22.216)", // Bright red
      info: "oklch(0.708 0.142 264.376)", // Royal blue info

      // Surface Colors (Royal dark blue hierarchy)
      background: "oklch(0.125 0.048 264.376)", // Rich dark royal blue #1a237e
      surface: "oklch(0.185 0.042 264.376)", // Slightly lighter royal blue #283593
      overlay: "oklch(0.185 0.042 264.376 / 0.95)",
      border: "oklch(0.245 0.036 264.376)", // Medium royal blue #3949ab

      // Text Hierarchy (Light on dark royal)
      "text-primary": "oklch(0.975 0.008 264.376)", // Off white with blue hint
      "text-secondary": "oklch(0.828 0.024 264.376)", // Light blue-white
      "text-muted": "oklch(0.675 0.036 264.376)", // Medium blue-gray

      // Interactive States
      accent: "oklch(0.245 0.036 264.376)", // Medium royal for hover
      "accent-foreground": "oklch(0.975 0.008 264.376)",
      muted: "oklch(0.245 0.036 264.376)",
      "muted-foreground": "oklch(0.675 0.036 264.376)",
    }
  },
  lite: {
    name: "Lite",
    description: "Clean minimal theme with neutral tones",
    colors: {
      // Brand Colors (Desaturated for minimal feel)
      primary: "oklch(0.556 0.048 264.376)", // #6b7280 - Neutral gray
      "primary-foreground": "oklch(0.985 0 0)",
      secondary: "oklch(0.682 0.032 264.376)", // #9ca3af - Light gray
      "secondary-foreground": "oklch(0.145 0 0)",

      // Functional Colors (Subtle saturation)
      success: "oklch(0.646 0.128 164.285)", // #10b981 - Muted green
      warning: "oklch(0.769 0.14 70.08)", // #f59e0b - Muted amber
      error: "oklch(0.627 0.18 22.216)", // #ef4444 - Muted red
      info: "oklch(0.556 0.048 264.376)",

      // Surface Colors (Near whites)
      background: "oklch(0.995 0.002 264.376)", // #fefefe - Almost white
      surface: "oklch(1 0 0)", // Pure white
      overlay: "oklch(1 0 0 / 0.98)",
      border: "oklch(0.964 0.004 264.376)", // #f3f4f6 - Very light gray

      // Text Hierarchy (High contrast)
      "text-primary": "oklch(0.145 0.008 264.376)", // #111827 - Near black
      "text-secondary": "oklch(0.556 0.048 264.376)", // #6b7280 - Medium gray
      "text-muted": "oklch(0.682 0.032 264.376)", // #9ca3af - Light gray

      // Interactive States
      accent: "oklch(0.964 0.004 264.376)",
      "accent-foreground": "oklch(0.145 0.008 264.376)",
      muted: "oklch(0.964 0.004 264.376)",
      "muted-foreground": "oklch(0.556 0.048 264.376)",
    }
  },
  dark: {
    name: "Dark",
    description: "Professional dark theme with blue highlights",
    colors: {
      // Brand Colors (Higher contrast for dark)
      primary: "oklch(0.646 0.178 264.376)", // #3b82f6 - Bright blue
      "primary-foreground": "oklch(0.145 0.024 264.376)", // Dark text on bright primary
      secondary: "oklch(0.708 0.142 264.376)", // #60a5fa - Lighter blue
      "secondary-foreground": "oklch(0.145 0.024 264.376)",

      // Functional Colors (Adjusted for dark backgrounds)
      success: "oklch(0.646 0.128 164.285)", // #10b981 - Green
      warning: "oklch(0.769 0.14 70.08)", // #f59e0b - Amber
      error: "oklch(0.708 0.142 22.216)", // #f87171 - Light red
      info: "oklch(0.646 0.178 264.376)",

      // Surface Colors (Dark hierarchy)
      background: "oklch(0.145 0.024 264.376)", // #0f172a - Dark blue-black
      surface: "oklch(0.205 0.024 264.376)", // #1e293b - Slightly lighter
      overlay: "oklch(0.205 0.024 264.376 / 0.95)",
      border: "oklch(0.269 0.024 264.376)", // #334155 - Medium dark

      // Text Hierarchy (Light on dark)
      "text-primary": "oklch(0.985 0.002 264.376)", // #f1f5f9 - Off white
      "text-secondary": "oklch(0.828 0.012 264.376)", // #cbd5e1 - Light gray
      "text-muted": "oklch(0.606 0.024 264.376)", // #64748b - Medium gray

      // Interactive States
      accent: "oklch(0.269 0.024 264.376)",
      "accent-foreground": "oklch(0.985 0.002 264.376)",
      muted: "oklch(0.269 0.024 264.376)",
      "muted-foreground": "oklch(0.708 0.015 264.376)",
    }
  }
} as const;

export type ThemeName = keyof typeof themes;