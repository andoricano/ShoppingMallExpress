import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.219.102", "192.168.219.103"],
  transpilePackages: ["@mall/constants", "@mall/mall-page-viewer"],
  async rewrites() {
    const apiUrl = process.env.API_URL;
    if (process.env.NODE_ENV === "production" && !apiUrl) {
      throw new Error("API_URL is required for production builds.");
    }
    const base = (apiUrl || "http://localhost:8080").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${base}/api/:path*` }];
  },
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/auth/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
export default nextConfig;
