import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayo-Olahraga | Industrial Fitness Engine",
  description: "Next-gen offline-first fitness tracker, biomechanical heatmap, and smart progressive overload",
};

export const viewport: Viewport = {
  themeColor: "#080808",
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
    <html lang="id" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#080808] text-gray-100 flex flex-col antialiased selection:bg-[#DFFF00] selection:text-black"
      >
        {children}
      </body>
    </html>
  );
}

