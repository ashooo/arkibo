import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"], ["Checklist", "/checklist"], ["Scanner", "/scanner"],
  ["Documents", "/documents"], ["Grades", "/grades"], ["Announcements", "/notifications"],
] as const;

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="shell"><nav className="nav">{links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav>{children}</main>;
}
