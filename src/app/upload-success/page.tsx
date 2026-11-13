import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UploadSuccess } from "@/features/documents/upload-success";

export default function UploadSuccessPreview() {
  return <main className="min-h-dvh bg-surface px-4 py-6 dark:bg-dark-bg sm:px-8">
    <header className="mx-auto flex max-w-5xl items-center justify-between"><Link href="/" className="flex items-center gap-2 text-lg font-bold"><Image src="/arkibo-logo.svg" alt="" width={36} height={36} className="dark:brightness-0 dark:invert" />Arkibo</Link><ThemeToggle /></header>
    <UploadSuccess demo />
  </main>;
}
