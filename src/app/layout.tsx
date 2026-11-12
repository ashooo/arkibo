import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarReady",
  description: "Scholarship application preparation for Pasig City students.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
