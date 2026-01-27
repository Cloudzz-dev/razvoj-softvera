import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";



import { DynamicBackground } from "@/components/ui/DynamicBackground";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { CommandMenu } from "@/components/ui/CommandMenu";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXTAUTH_URL?.startsWith("http") ? env.NEXTAUTH_URL : `https://${env.NEXTAUTH_URL || "dfds.dev"}`),
  title: {
    default: "DFDS - Connect, Build, Invest",
    template: "%s | DFDS",
  },
  description: "The platform connecting founders, developers, and investors. Build your dream team and launch your startup.",
  keywords: ["startup", "founder", "developer", "investor", "co-founder", "networking", "tech", "dfds"],
  authors: [{ name: "Team Cloudzz" }],
  creator: "DFDS",
  icons: {
    icon: "/start-it-favicon.png",
    shortcut: "/start-it-favicon.png",
    apple: "/start-it-favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "DFDS - Connect, Build, Invest",
    description: "The platform connecting founders, developers, and investors.",
    siteName: "DFDS",
    images: [
      {
        url: "/start-it-favicon.png", // Detailed OG image recommended for production
        width: 1200,
        height: 630,
        alt: "DFDS Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DFDS - Connect, Build, Invest",
    description: "The platform connecting founders, developers, and investors.",
    images: ["/start-it-favicon.png"],
    creator: "@dfds_dev",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden`}>
        <AuthProvider>
          <PostHogProvider>
            <DynamicBackground />
            <CommandMenu />
            {children}
            <SpeedInsights />
            <CookieConsent />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "rgba(0, 0, 0, 0.8)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "9999px",
                },
              }}
            />
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
