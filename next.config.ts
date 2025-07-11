import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Simple configuration for WASM files served from /public directory
  // No complex bundler configuration needed since we use fetch() API
};

export default nextConfig;
