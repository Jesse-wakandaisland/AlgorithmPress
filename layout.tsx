import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "Gen8Data – Instant AI & Template Dataset Generator",
  description:
    "Generate custom datasets instantly with AI or ready-made templates. Export as CSV or Excel. Perfect for developers, analysts, and anyone needing mock data fast.",
  keywords: [
    "dataset generator",
    "AI dataset generator",
    "mock data",
    "CSV export",
    "Excel export",
    "data templates",
    "data analysis",
    "data science",
    "prototyping",
    "data visualization",
    "sample data",
    "web-based tool",
  ],
  openGraph: {
    title: "Gen8Data – Instant AI & Template Dataset Generator",
    description:
      "Create custom datasets in seconds using AI or predefined templates. Export to CSV or Excel. No setup required – perfect for developers and analysts.",
    url: "https://gen8data.vercel.app",
    siteName: "Gen8Data",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gen8Data – Instant AI & Template Dataset Generator",
    description:
      "Generate mock datasets instantly with AI or templates. Export as CSV or Excel. Fast, intuitive, and web-based.",
    site: "@gen8data",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
