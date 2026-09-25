import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mall/constants", "@mall/mall-page-viewer", "@mall/tiptap"],
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      { source: "/auth/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
export default nextConfig;
