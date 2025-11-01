"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { ThemeProvider as NextThemesProvider } from "next-themes";
export function Providers({ children }) {
    return (_jsx(NextThemesProvider, { attribute: "class", defaultTheme: "light", enableSystem: true, disableTransitionOnChange: true, enableColorScheme: true, children: children }));
}
//# sourceMappingURL=providers.js.map