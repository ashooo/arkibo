import type { Metadata } from "next";
import "./globals.css";
import { StudentProvider } from "@/lib/student-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Arkibo — Pasig City Scholarship Portal",
  description:
    "Scholarship portal for learners at every education level. Track requirements, digitize documents with Lumen OCR, and monitor verified grades.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="text-on-surface dark:text-slate-100 antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="scholarready-theme">
          <StudentProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton theme="system" />
          </StudentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
