"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="relative"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={toggleTheme}
    >
      <Sun className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
      <Moon className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
    </Button>
  );
}
