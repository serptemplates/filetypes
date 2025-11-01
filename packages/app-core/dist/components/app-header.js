"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Menu, X } from "lucide-react";
import { Button } from "@serp-tools/ui/components/button";
import { useState } from "react";
export function AppHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navLinks = [
        { href: "/", label: "Tools" },
        { href: "/files", label: "Files" },
        { href: "/extensions", label: "Extensions" },
    ];
    return (_jsx("header", { className: "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", children: _jsxs("div", { className: "container", children: [_jsxs("div", { className: "flex h-16 items-center justify-between", children: [_jsx("a", { href: "/", className: "flex items-center space-x-2", children: _jsx("span", { className: "text-2xl font-bold text-primary", children: "SERP" }) }), _jsx("nav", { "aria-label": "Main navigation", className: "hidden md:flex md:items-center md:space-x-6", children: navLinks.map((link) => (_jsx("a", { href: link.href, className: "text-sm font-medium text-muted-foreground transition-colors hover:text-primary", children: link.label }, link.href))) }), _jsx(Button, { "aria-expanded": isMenuOpen, "aria-controls": "mobile-navigation", "aria-label": "Toggle navigation menu", variant: "ghost", size: "icon", className: "md:hidden", onClick: () => setIsMenuOpen(!isMenuOpen), children: isMenuOpen ? (_jsx(X, { className: "h-5 w-5" })) : (_jsx(Menu, { className: "h-5 w-5" })) })] }), _jsx("nav", { id: "mobile-navigation", "aria-label": "Mobile navigation", className: `border-t py-4 md:hidden ${isMenuOpen ? 'block' : 'hidden'}`, children: _jsx("div", { className: "space-y-1", children: navLinks.map((link) => (_jsx("a", { href: link.href, className: "block px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary", onClick: () => setIsMenuOpen(false), children: link.label }, link.href))) }) })] }) }));
}
//# sourceMappingURL=app-header.js.map