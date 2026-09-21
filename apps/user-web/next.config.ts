import type { NextConfig } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : undefined);

if (!API_BASE_URL) {
    throw new Error(
        "NEXT_PUBLIC_API_URL must be set outside development.",
    );
}

const nextConfig: NextConfig = {
    allowedDevOrigins: [
        "192.168.219.103",
    ],

    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${API_BASE_URL}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
