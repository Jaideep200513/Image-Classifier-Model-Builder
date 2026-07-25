import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ModelForge — Image Classification Platform",
    template: "%s | ModelForge",
  },
  description:
    "An internal image classification model preparation platform. Train, preview, and export custom image classification models without any ML expertise.",
  keywords: [
    "image classification",
    "machine learning",
    "model training",
    "computer vision",
    "dataset management",
  ],
  authors: [{ name: "ModelForge Team" }],
  openGraph: {
    type: "website",
    title: "ModelForge — Image Classification Platform",
    description:
      "Train image classification models visually. No ML expertise required.",
    siteName: "ModelForge",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-background"
      >
        <Providers>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
