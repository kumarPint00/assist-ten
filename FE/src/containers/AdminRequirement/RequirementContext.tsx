"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

export interface RequirementRecord {
  id: string;
  title: string;
  description: string;
  department: string;
  level: string;
  location: string;
  priority: string;
  status: string;
  skills: string[];
}

interface RequirementForm {
  title: string;
  description: string;
  department: string;
  level: string;
  location: string;
  priority: string;
  status: string;
}

const defaultRequirements: RequirementRecord[] = [
  {
    id: "R-0084",
    title: "Backend API Engineer",
    description: "Build scalable services for the assessment platform.",
    department: "Product Engineering",
    level: "Senior",
    location: "Bengaluru HQ",
    priority: "High",
    status: "Open",
    skills: ["Python", "Kafka", "FastAPI"],
  },
  {
    id: "R-0085",
    title: "Candidate Experience Analyst",
    description: "Monitor candidate journeys and improve handoffs.",
    department: "Experience Ops",
    level: "Mid",
    location: "Remote",
    priority: "Medium",
    status: "Draft",
    skills: ["Looker", "SQL", "Research"],
  },
];

type RequirementFilters = {
  status: string;
  priority: string;
  query: string;
};

interface RequirementContextValue {
  formData: RequirementForm;
  handleFormChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  updateFormField: (field: keyof RequirementForm, value: string) => void;
  handleSubmit: (event: React.FormEvent) => void;
  requirements: RequirementRecord[];
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
  skillLevels: Record<string, "strong" | "advance" | "intermediate" | "basic">;
  setSkillLevels: React.Dispatch<React.SetStateAction<Record<string, "strong" | "advance" | "intermediate" | "basic">>>;
  clearSkillInputs: () => void;
  priorityCounts: Record<string, number>;
  managementFilters: RequirementFilters;
  handleFilterChange: (field: keyof RequirementFilters, value: string) => void;
  filteredManagementRequirements: RequirementRecord[];
  requirementStatuses: readonly ["Open", "Draft", "Closed"];
  handleStatusChange: (id: string, nextStatus: RequirementRecord["status"]) => void;
  handleDuplicateRequirement: (requirement: RequirementRecord) => void;
}

const RequirementContext = createContext<RequirementContextValue | undefined>(undefined);

const initialFilters: RequirementFilters = {
  status: "All",
  priority: "All",
  query: "",
};

const initialFormData: RequirementForm = {
  title: "",
  description: "",
  department: "",
  level: "",
  location: "",
  priority: "",
  status: "",
};

export const RequirementProvider = ({ children }: { children: React.ReactNode }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<RequirementContextValue["skillLevels"]>({});
  const [requirements, setRequirements] = useState<RequirementRecord[]>(defaultRequirements);
  const [managementFilters, setManagementFilters] = useState<RequirementFilters>(initialFilters);

  const requirementStatuses: RequirementContextValue["requirementStatuses"] = ["Open", "Draft", "Closed"];

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateFormField = (field: keyof RequirementForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const clearSkillInputs = () => {
    setSkills([]);
    setSkillLevels({});
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const timestamp = new Date().getTime();
    const newRequirement: RequirementRecord = {
      id: `R-${timestamp.toString().slice(-4)}`,
      title: formData.title.trim() || "Untitled Role",
      description: formData.description.trim(),
      department: formData.department || "Product",
      level: formData.level || "Mid",
      location: formData.location || "Hybrid",
      priority: formData.priority || "Medium",
      status: formData.status || "Open",
      skills,
    };
    setRequirements((prev) => [newRequirement, ...prev]);
    alert("Requirement created successfully!");
    setFormData(initialFormData);
    clearSkillInputs();
  };

  const handleStatusChange = (id: string, nextStatus: RequirementRecord["status"]) => {
    setRequirements((prev) => prev.map((req) => (req.id === id ? { ...req, status: nextStatus } : req)));
  };

  const handleDuplicateRequirement = (requirement: RequirementRecord) => {
    const duplicate: RequirementRecord = {
      ...requirement,
      id: `R-${new Date().getTime().toString().slice(-4)}`,
    };
    setRequirements((prev) => [duplicate, ...prev]);
  };

  const handleFilterChange = (field: keyof RequirementFilters, value: string) => {
    setManagementFilters((prev) => ({ ...prev, [field]: value }));
  };

  const filteredManagementRequirements = useMemo(() => {
    const query = managementFilters.query.toLowerCase();
    return requirements.filter((req) => {
      const matchesStatus = managementFilters.status === "All" || req.status === managementFilters.status;
      const matchesPriority = managementFilters.priority === "All" || req.priority === managementFilters.priority;
      const matchesQuery =
        req.title.toLowerCase().includes(query) ||
        req.department.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query);
      return matchesStatus && matchesPriority && matchesQuery;
    });
  }, [managementFilters, requirements]);

  const priorityCounts = useMemo(
    () =>
      requirements.reduce(
        (counts, req) => ({
          ...counts,
          [req.priority || "Medium"]: (counts[req.priority || "Medium"] || 0) + 1,
        }),
        {} as Record<string, number>
      ),
    [requirements]
  );

  const value: RequirementContextValue = {
    formData,
    handleFormChange,
    updateFormField,
    handleSubmit,
    requirements,
    skills,
    setSkills,
    skillLevels,
    setSkillLevels,
    clearSkillInputs,
    priorityCounts,
    managementFilters,
    handleFilterChange,
    filteredManagementRequirements,
    requirementStatuses,
    handleStatusChange,
    handleDuplicateRequirement,
  };

  return <RequirementContext.Provider value={value}>{children}</RequirementContext.Provider>;
};

export const useRequirementContext = () => {
  const context = useContext(RequirementContext);
  if (!context) {
    throw new Error("useRequirementContext must be used within RequirementProvider");
  }
  return context;
};
