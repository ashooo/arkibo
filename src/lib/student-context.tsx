"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

import { accountRequest, schoolName, type AccountUser } from "@/lib/account";

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
  student: StudentProfile;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const profile = user?.profile;

  useEffect(() => {
    let active = true;
    void accountRequest().then((account) => {
      if (active) setUser(account);
    }).catch(() => {}).finally(() => {
      if (active) setAccountLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <StudentContext.Provider
      value={{
        user,
        setUser,
        accountLoading,
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

