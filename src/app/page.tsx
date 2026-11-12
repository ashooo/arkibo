import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <p className="muted">ScholarReady</p>
      <h1>Prepare your scholarship application with confidence.</h1>
      <p>Track requirements, organize scanned documents, and review your grade history.</p>
      <Link href="/dashboard">Open demo dashboard →</Link>
    </main>
  );
}
