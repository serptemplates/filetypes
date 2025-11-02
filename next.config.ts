import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Build at the root of the domain (no basePath)
  transpilePackages: ["@serp-filetypes/ui", "@serp-filetypes/app-core"],
  trailingSlash: true,
  // Ensure certain native/wasm libs are not bundled for the server runtime
  // so we can load them dynamically at runtime.
  // Supported in modern Next versions; harmless if ignored.
  serverExternalPackages: ["sql.js"],
  eslint: {
    ignoreDuringBuilds: true,
  },
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
  async redirects() {
    return [
      { source: '/mediatypes/:path*', destination: '/mimetypes/:path*', permanent: true },
      { source: '/mime/:path*', destination: '/mimetypes/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
