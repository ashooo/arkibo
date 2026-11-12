"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useStudent } from "@/lib/student-context";

export function AccountWorkspace({ children }: { children: ReactNode }) {
  const { user, accountLoading } = useStudent();
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user?.profile) return;
    let active = true;
    void fetch("/api/students", { method: "POST" }).then(async (response) => {
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to open workspace.");
      if (active) { setReadyFor(user.id); setError(""); }
    }).catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [user]);
  if (accountLoading) return <p role="status">Loading account…</p>;
  if (!user?.profile) return <p><Link href="/account">Sign in and complete your account profile</Link> to use your documents and grades.</p>;
  if (readyFor !== user.id) return <p role="status">{error || "Opening your workspace…"}</p>;
  return <div className="dev1-workspace" key={user.id}>{children}</div>;
}
