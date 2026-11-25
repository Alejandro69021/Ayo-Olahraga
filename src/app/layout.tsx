import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ayo-Olahraga | Industrial Fitness Engine",
  description: "Next-gen offline-first fitness tracker, biomechanical heatmap, and smart progressive overload",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const serviceWorkerScript =
  process.env.NODE_ENV === "production"
    ? `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').catch(function(err) {
            console.error('ServiceWorker registration failed: ', err);
          });
        });
      }
    `
    : `
      window.addEventListener('load', function() {
        if ('serviceWorker' in navigator) {
          try {
            navigator.serviceWorker.getRegistrations()
              .then(function(registrations) {
                return Promise.all(
                  registrations.map(function(reg) {
                    return reg.unregister();
                  })
                );
              })
              .catch(function(err) {
                console.warn('ServiceWorker cleanup failed: ', err);
              });
          } catch (err) {
            console.warn('ServiceWorker cleanup failed: ', err);
          }
        }
        if ('caches' in window) {
          try {
            caches.keys()
              .then(function(keys) {
                return Promise.all(
                  keys
                    .filter(function(key) {
                      return key.startsWith('ayo-olahraga');
                    })
                    .map(function(key) {
                      return caches.delete(key);
                    })
                );
              })
              .catch(function(err) {
                console.warn('Cache cleanup failed: ', err);
              });
          } catch (err) {
            console.warn('Cache cleanup failed: ', err);
          }
        }
      });
    `;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`dark ${inter.variable} ${oswald.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#080808] text-gray-100 flex flex-col antialiased selection:bg-[#DFFF00] selection:text-black"
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: serviceWorkerScript,
          }}
        />
      </body>
    </html>
  );
}

