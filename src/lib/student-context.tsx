"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

import { accountRequest, schoolName, type AccountUser } from "@/lib/account";
import { toast } from "sonner";
import { useHydrated } from "@/lib/use-hydrated";

export type ApplicationType = "new" | "renewal";

export interface StudentProfile {
  id: string;
  name: string;
  school: string;
  program: string;
  studentNumber: string;
  yearLevel: string;
  status: "Active Scholar" | "Applicant";
  term: string;
}

export const DEMO_STUDENT: StudentProfile = {
  id: "student-demo-pasig-01",
  name: "Miguel A. Santos",
  school: "Pamantasan ng Lungsod ng Pasig",
  program: "BS Information Technology",
  yearLevel: "2nd Year",
  studentNumber: "2023-001234",
  status: "Active Scholar",
  term: "AY 2024–2025 • 1st Semester",
};

interface StudentContextType {
  user: AccountUser | null;
  setUser: (user: AccountUser | null) => void;
  accountLoading: boolean;
  applicationType: ApplicationType;
  setApplicationType: (type: ApplicationType) => void;
  student: StudentProfile;
  toggleApplicationType: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const [applicationType, setAppTypeState] = useState<ApplicationType>(() => {
    if (typeof window === "undefined") return "renewal";
    try {
      const saved = localStorage.getItem("scholarready_app_type");
      return saved === "new" || saved === "renewal" ? saved : "renewal";
    } catch { return "renewal"; }
  });
  const [user, setUser] = useState<AccountUser | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const profile = user?.profile;
  const currentTrack: ApplicationType = profile?.track ?? (hydrated ? applicationType : "renewal");

  useEffect(() => {
    let active = true;
    void accountRequest().then((account) => {
      if (active) setUser(account);
    }).catch(() => {}).finally(() => {
      if (active) setAccountLoading(false);
    });
    return () => { active = false; };
  }, []);

  const setApplicationType = (type: ApplicationType) => {
    if (profile) {
      void accountRequest("POST", { action: "track", track: type }).then(setUser)
        .catch(() => toast.error("Couldn’t switch your application track. Try again."));
      return;
    }
    setAppTypeState(type);
    if (typeof window !== "undefined") {
      localStorage.setItem("scholarready_app_type", type);
    }
  };

  const toggleApplicationType = () => {
    const next = currentTrack === "renewal" ? "new" : "renewal";
    setApplicationType(next);
  };

  return (
    <StudentContext.Provider
      value={{
        user,
        setUser,
        accountLoading,
        applicationType: currentTrack,
        setApplicationType,
        student: user ? {
          id: user.id,
          name: profile?.name ?? "Student",
          school: profile?.school ?? schoolName,
          program: "",
          studentNumber: "",
          yearLevel: profile?.yearLevel ?? "",
          status: "Applicant",
          term: "",
        } : DEMO_STUDENT,
        toggleApplicationType,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
}

