import { THEME_STORAGE_KEY } from "@/lib/theme";

const themeScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    const theme = storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
      ? storedTheme
      : "system";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const resolvedTheme = theme === "system" ? systemTheme : theme;
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
  } catch {
    // Ignore storage failures before React hydrates.
  }
})();
`;

export function ThemeScript() {
  return (
    <script
      id="reverseed-theme"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
