import { AccountWorkspace } from "@/features/account-workspace";
import { DocumentLibrary } from "@/features/documents/document-library";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ add?: string; review?: string }> }) {
  const params = await searchParams;
  return <AccountWorkspace><DocumentLibrary initialAddOpen={params.add === "1"} initialReviewId={params.review} /></AccountWorkspace>;
}
