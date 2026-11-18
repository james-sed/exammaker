/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // `unpdf` ships a pre-bundled ESM PDF.js build and `file-type` is ESM-only.
    // Resolve both natively at runtime instead of bundling them into the server
    // build, which also keeps the PDF.js worker self-contained.
    serverComponentsExternalPackages: ["unpdf", "file-type"],
  },
  webpack: (config) => {
    // PDF.js optionally resolves `canvas`; text extraction never renders pages.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
