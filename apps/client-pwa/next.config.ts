import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mall/constants", "@mall/mall-page-viewer"],
  async rewrites() {
    const apiUrl = process.env.API_URL?.replace(/\/$/, "");
    if (process.env.NODE_ENV === "production" && !apiUrl) {
      throw new Error("API_URL is required for production builds.");
    }
    const base = apiUrl ?? "http://localhost:8080";
    return [{ source: "/api/:path*", destination: `${base}/api/:path*` }];
  },
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      { source: "/auth/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/client/orders/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/client/history/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/client/refunds/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/client/points/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/client/payment/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/client/wishlist/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/client/cart/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
export default nextConfig;
