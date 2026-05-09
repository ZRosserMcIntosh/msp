import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SupportHotkey } from "@/components/support/SupportHotkey";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MSP — Enterprise Managed Services Platform",
  description:
    "The all-in-one platform for managed IT services, real estate operations, device lifecycle management, and hosted brokerage solutions.",
  keywords: [
    "MSP",
    "managed services",
    "IT management",
    "real estate platform",
    "device lifecycle",
    "brokerage operations",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen overflow-x-hidden`}
      >
        {children}
        <SupportHotkey />
      </body>
    </html>
  );
}
