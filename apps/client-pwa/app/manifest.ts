import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Mall Pocket", short_name: "Mall", lang: "ko",
    description: "나만의 작은 쇼핑 공간", start_url: "/", scope: "/", display: "standalone",
    theme_color: "#173e35", background_color: "#f6f5f0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ic_target_512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
