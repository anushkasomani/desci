import type { Metadata } from "next";
import { Sora } from "next/font/google";
import Providers from "./providers"; // Assuming you have this file for context providers
import "./globals.css";

const sora = Sora({ 
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GENOME - AI-Powered IP Tokenization",
  description: "Transforming intellectual property into digital assets with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${sora.className} bg-gray-950 text-gray-200 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}