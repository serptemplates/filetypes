"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { GoogleTagManager } from "@next/third-parties/google";
export function GTagManager() {
    const gtmId = "GTM-PP9W77LK";
    if (process.env.NODE_ENV === "development") {
        return null;
    }
    return _jsx(GoogleTagManager, { gtmId: gtmId });
}
//# sourceMappingURL=gtag-manager.js.map