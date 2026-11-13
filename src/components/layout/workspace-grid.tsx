import Link from "next/link";
import { ArrowRight, Megaphone, SquareCheck, File, ChartNoAxesColumnIncreasing } from "lucide-react";

const workspaces = [
  ["Checklist", "/checklist", "Review your scholarship requirements.", SquareCheck, "green"],
  ["My Documents", "/documents", "Add documents, extract text, and find your saved files.", File, "purple"],
  ["Grades", "/grades", "Open your academic records workspace.", ChartNoAxesColumnIncreasing, "gold"],
  ["Announcements", "/notifications", "Browse scholarship, allowance, and SPES notices.", Megaphone, "blue"],
] as const;

export function WorkspaceGrid() {
  return (
    <section aria-labelledby="workspaces-heading" className="space-y-4">
      <h2 id="workspaces-heading" className="text-2xl font-semibold">Your workspaces</h2>
      <ul className="grid gap-5 sm:grid-cols-2">
        {workspaces.map(([title, href, description, Icon, tone]) => (
          <li key={href}>
            <Link href={href} className="feature-tile" data-tone={tone}>
              <span className="feature-icon"><Icon aria-hidden="true" size={28} /></span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant dark:text-slate-300">{description}</p>
              </div>
              <span className="feature-arrow"><ArrowRight aria-hidden="true" size={20} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
