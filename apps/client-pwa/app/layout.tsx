import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mall Pocket",
  description: "상품 탐색부터 장바구니와 주문까지",
  appleWebApp: { capable: true, title: "Mall Pocket", statusBarStyle: "default" },
  icons: { apple: "/ic_target_512.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#173e35" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
