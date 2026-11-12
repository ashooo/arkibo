import type { Metadata } from "next";
import "./globals.css";
import { StudentProvider } from "@/lib/student-context";

export const metadata: Metadata = {
  title: "ScholarReady — Pasig City Scholarship Portal",
  description:
    "Independent scholarship preparation, Lumen OCR document scanner, and grade history portal for Pasig City college scholars.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-surface text-on-surface antialiased min-h-screen">
        <StudentProvider>{children}</StudentProvider>
      </body>
    </html>
  );
}
