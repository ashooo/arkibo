"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChecklistStatus } from "@/types/shared";
import type { RequirementTemplate } from "@/data/requirements";

export type ItemState = { status: ChecklistStatus; notes: string; documentIds: string[] };
export type ChecklistFolder = { id: string; name: string; deadline: string; total: number; prepared: number; documents: number };
type View = { items: Record<string, ItemState>; customTemplates: RequirementTemplate[]; deadline: string; listId: string; lists: ChecklistFolder[] };

export function useChecklist() {
  const [items, setItems] = useState<View["items"]>({});
  const [customTemplates, setCustomTemplates] = useState<RequirementTemplate[]>([]);
  const [deadline, setDeadline] = useState("");
  const [listId, setListId] = useState("");
  const [lists, setLists] = useState<ChecklistFolder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const active = useRef(true);
  const apply = (data: View) => { setItems(data.items); setCustomTemplates(data.customTemplates); setDeadline(data.deadline); setListId(data.listId); setLists(data.lists); };
  useEffect(() => {
    active.current = true;
    void fetch("/api/checklist", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load checklist.");
      if (active.current) { apply(data); setLoaded(true); }
    }).catch((reason: Error) => { if (active.current) setError(reason.message); });
    return () => { active.current = false; };
  }, []);

  function mutate<T = View>(path: string, method: string, body: object, onSuccess?: (data: T) => void): Promise<boolean> {
    setPending((count) => count + 1);
    const operation = queue.current.then(async () => {
      // Never let queued edits run under a different account after logout/navigation.
      if (!active.current) return false;
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listId, ...body }) });
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
    setLists((current) => current.map((list) => list.id === listId ? { ...list, deadline: value } : list));
    return mutate("/api/checklist", "PATCH", { deadline: value });
  }
  function addRequirement(title: string, description: string) {
    return mutate<{ requirement: RequirementTemplate }>("/api/checklist", "POST", { title, description }, (data) => setCustomTemplates((current) => [...current, data.requirement]));
  }
  function editRequirement(id: string, title: string, description: string) {
    return mutate<{ requirement: RequirementTemplate }>(`/api/checklist/${encodeURIComponent(id)}`, "PATCH", { title, description }, (data) => {
      setCustomTemplates((current) => current.map((template) => template.id === id ? { ...template, title: data.requirement.title, description: data.requirement.description } : template));
    });
  }
  function deleteRequirement(id: string) {
    return mutate(`/api/checklist/${encodeURIComponent(id)}`, "DELETE", {}, () => {
      setCustomTemplates((current) => current.filter((template) => template.id !== id));
      setItems((current) => { const next = { ...current }; delete next[id]; return next; });
    });
  }
  async function load(nextListId?: string) {
    setLoaded(false);
    try {
      // Wait for queued saves so the reloaded view includes them.
      await queue.current;
      const response = await fetch(nextListId ? `/api/checklist?listId=${encodeURIComponent(nextListId)}` : "/api/checklist", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load checklist.");
      if (active.current) { apply(data); setError(""); }
    } catch (reason) { if (active.current) setError(reason instanceof Error ? reason.message : "Unable to load checklist."); }
    finally { if (active.current) setLoaded(true); }
  }
  const switchChecklist = (nextListId: string) => load(nextListId);
  const refreshFolders = () => load(listId || undefined);
  function createChecklist(name: string, template: "empty" | "new" | "renewal" = "empty") {
    return mutate("/api/checklist", "POST", { name, template }, (data) => apply(data));
  }
  return { items, customTemplates, deadline, loaded, pending, error, listId, lists, updateItem, saveDeadline, addRequirement, editRequirement, deleteRequirement, switchChecklist, refreshFolders, createChecklist };
}
