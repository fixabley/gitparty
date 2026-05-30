export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "reverseed-theme";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveThemePreference({
  preference,
  systemTheme,
}: {
  preference: ThemePreference;
  systemTheme: ResolvedTheme;
}): ResolvedTheme {
  return preference === "system" ? systemTheme : preference;
}

export function nextThemePreference({
  resolvedTheme,
}: {
  resolvedTheme: ResolvedTheme;
}): ThemePreference {
  return resolvedTheme === "dark" ? "light" : "dark";
}
