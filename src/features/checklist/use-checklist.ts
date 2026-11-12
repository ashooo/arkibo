"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ApplicationType, ChecklistStatus } from "@/types/shared";
import type { RequirementTemplate } from "@/data/requirements";

export type ItemState = { status: ChecklistStatus; notes: string; documentIds: string[] };
type View = { items: Record<string, ItemState>; customTemplates: RequirementTemplate[]; deadline: string };

export function useChecklist(applicationType: ApplicationType) {
  const [items, setItems] = useState<View["items"]>({});
  const [customTemplates, setCustomTemplates] = useState<RequirementTemplate[]>([]);
  const [deadline, setDeadline] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    void fetch(`/api/checklist?type=${applicationType}`, { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load checklist.");
      if (active.current) { setItems(data.items); setCustomTemplates(data.customTemplates); setDeadline(data.deadline); setLoaded(true); }
    }).catch((reason: Error) => { if (active.current) setError(reason.message); });
    return () => { active.current = false; };
  }, [applicationType]);

  function mutate(path: string, method: string, body: object, onSuccess?: (data: View & { requirement: RequirementTemplate }) => void): Promise<boolean> {
    setPending((count) => count + 1);
    const operation = queue.current.then(async () => {
      // Never let queued edits run under a different account after logout/navigation.
      if (!active.current) return false;
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, applicationType }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save changes.");
      if (active.current) onSuccess?.(data);
      return true;
    }).catch((reason: Error) => {
      if (active.current) { setError(`${reason.message} Some changes may be unsaved. Reload to recover the last saved checklist.`); toast.error(reason.message); }
      return false;
    }).finally(() => { if (active.current) setPending((count) => count - 1); });
    queue.current = operation;
    return operation;
  }
  function updateItem(id: string, update: Partial<ItemState>) {
    if (!loaded) return Promise.resolve(false);
    setItems((current) => {
      const item = current[id] ?? { status: "missing", notes: "", documentIds: [] };
      const status = update.status ?? (update.documentIds ? (update.documentIds.length && item.status === "missing" ? "uploaded" : !update.documentIds.length && item.status === "uploaded" ? "missing" : item.status) : item.status);
      return { ...current, [id]: { ...item, ...update, status } };
    });
    return mutate(`/api/checklist/${encodeURIComponent(id)}`, "PATCH", update);
  }
  function saveDeadline(value: string) {
    setDeadline(value);
    return mutate("/api/checklist", "PATCH", { deadline: value });
  }
  function addRequirement(title: string, description: string) {
    return mutate("/api/checklist", "POST", { title, description }, (data) => setCustomTemplates((current) => [...current, data.requirement]));
  }
  return { items, customTemplates, deadline, loaded, pending, error, updateItem, saveDeadline, addRequirement };
}
