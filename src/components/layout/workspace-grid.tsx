import Link from "next/link";
import { ArrowUpRight, Bell, ClipboardList, FolderArchive, GraduationCap, ScanText } from "lucide-react";

const workspaces = [
  ["Checklist", "/checklist", "Review your scholarship requirements.", ClipboardList, "blue"],
  ["Scanner & OCR", "/scanner", "Open the document scanning workspace.", ScanText, "green"],
  ["My Documents", "/documents", "Go to your scholarship document library.", FolderArchive, "purple"],
  ["Grades", "/grades", "Open your academic records workspace.", GraduationCap, "gold"],
  ["Announcements", "/notifications", "Browse scholarship, allowance, and SPES notices.", Bell, "blue"],
] as const;

export function WorkspaceGrid() {
  return (
    <section aria-labelledby="workspaces-heading" className="space-y-4">
      <h2 id="workspaces-heading" className="text-xl font-semibold">Your workspaces</h2>
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {workspaces.map(([title, href, description, Icon, tone]) => (
          <li key={href}>
            <Link href={href} className="workspace-card">
              <div className="workspace-cover" data-tone={tone}>
                <h3 className="text-xl font-semibold">{title}</h3>
                <Icon aria-hidden="true" size={32} className="shrink-0" />
              </div>
              <div className="flex flex-1 items-start justify-between gap-3 p-4 text-sm text-on-surface-variant dark:text-slate-300">
                <p>{description}</p>
                <ArrowUpRight aria-hidden="true" size={17} className="shrink-0 text-primary dark:text-dark-accent" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
