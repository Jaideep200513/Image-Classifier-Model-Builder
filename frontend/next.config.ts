import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker multi-stage build: produces a self-contained server.js
  output: "standalone",
};

export default nextConfig;
