// Resolve UI package's PostCSS config via a relative path to ensure
// Next can load it even if the workspace package isn't hoisted here.
export { default } from "./packages/ui/postcss.config.mjs";
