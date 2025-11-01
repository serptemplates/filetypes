import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "./app-header";
import { Providers } from "./providers";
import { GTagManager } from "./gtag-manager";
import "@serp-tools/ui/globals.css";
const fontSans = Geist({
    subsets: ["latin"],
    variable: "--font-sans",
});
const fontMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
});
export function AppLayout({ children, }) {
    return (_jsx("html", { lang: "en", suppressHydrationWarning: true, children: _jsxs("body", { className: `${fontSans.variable} ${fontMono.variable} font-sans antialiased `, children: [_jsx(GTagManager, {}), _jsxs(Providers, { children: [_jsx(AppHeader, {}), children] })] }) }));
}
//# sourceMappingURL=app-layout.js.map