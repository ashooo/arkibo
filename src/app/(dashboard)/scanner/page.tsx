import { redirect } from "next/navigation";

export default function ScannerPage() {
  redirect("/documents?add=1");
}
