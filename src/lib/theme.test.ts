import { describe, expect, it } from "vitest";

import {
  isThemePreference,
  nextThemePreference,
  resolveThemePreference,
} from "@/lib/theme";

describe("theme preferences", () => {
  it("accepts supported theme preference values only", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("auto")).toBe(false);
  });

  it("resolves system preference using the current system theme", () => {
    expect(
      resolveThemePreference({
        preference: "system",
        systemTheme: "dark",
      })
    ).toBe("dark");
    expect(
      resolveThemePreference({
        preference: "light",
        systemTheme: "dark",
      })
    ).toBe("light");
  });

  it("toggles between explicit light and dark preferences", () => {
    expect(nextThemePreference({ resolvedTheme: "dark" })).toBe("light");
    expect(nextThemePreference({ resolvedTheme: "light" })).toBe("dark");
  });
});
