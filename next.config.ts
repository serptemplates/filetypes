import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'export',
  // Build at the root of the domain (no basePath)
  transpilePackages: ["@serp-filetypes/ui", "@serp-filetypes/app-core"],
  trailingSlash: true,
  // Pin tracing root to this package to avoid Next inferring a parent workspace root
  // when multiple lockfiles exist on the machine.
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'docs.fileformat.com' },
      { protocol: 'https', hostname: 'fileinfo.com' },
      { protocol: 'https', hostname: 'file.org' },
      { protocol: 'https', hostname: 'filext.com' },
      { protocol: 'https', hostname: 'assets.file.org' }
    ],
  },
};

export default nextConfig;
