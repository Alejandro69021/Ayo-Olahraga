import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayo-Olahraga | 100x Modern Fitness Engine",
  description: "Next-gen offline-first fitness tracker, biomechanical heatmap, and smart progressive overload",
};

export const viewport: Viewport = {
  themeColor: "#090a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

