"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  applicationType: ApplicationType;
  setApplicationType: (type: ApplicationType) => void;
  student: StudentProfile;
  toggleApplicationType: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [applicationType, setAppTypeState] = useState<ApplicationType>("renewal");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("scholarready_app_type") as ApplicationType | null;
    if (saved === "new" || saved === "renewal") {
      setAppTypeState(saved);
    }
  }, []);

  const setApplicationType = (type: ApplicationType) => {
    setAppTypeState(type);
    if (typeof window !== "undefined") {
      localStorage.setItem("scholarready_app_type", type);
    }
  };

  const toggleApplicationType = () => {
    const next = applicationType === "renewal" ? "new" : "renewal";
    setApplicationType(next);
  };

  return (
    <StudentContext.Provider
      value={{
        applicationType: mounted ? applicationType : "renewal",
        setApplicationType,
        student: DEMO_STUDENT,
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

