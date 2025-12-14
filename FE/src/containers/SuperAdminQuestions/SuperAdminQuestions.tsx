"use client";
import React, { useMemo, useState } from "react";
import { mcqQuestions } from "../../sampleData";
import "./SuperAdminQuestions.scss";

type TemplateQuestion = {
  id: number;
  text: string;
  focus: string;
  complexity: string;
  flag?: "low" | "review" | null;
};

type SkillWeight = {
  label: string;
  weight: number;
  category: string;
};

type RubricEntry = {
  label: string;
  detail: string;
  focus: string;
};

type QuestionTemplate = {
  id: string;
  role: string;
  seniority: string;
  locked: boolean;
  title: string;
  status: string;
  qualityScore: number;
  generatedAt: string;
  skillWeights: SkillWeight[];
  questions: TemplateQuestion[];
  rubrics: RubricEntry[];
};

const questionTemplates: QuestionTemplate[] = [
  {
    id: "tpl-agentic-ai",
    role: "Technical",
    seniority: "Senior",
    locked: true,
    title: "Agentic AI Reliability Playbook",
    status: "Locked",
    qualityScore: 92,
    generatedAt: "2025-12-03T11:22:00Z",
    skillWeights: [
      { label: "System Design", weight: 32, category: "Architecture" },
      { label: "Problem Solving", weight: 28, category: "Algorithm" },
      { label: "Agentic Workflows", weight: 22, category: "Workflow" },
      { label: "Observability", weight: 18, category: "Reliability" },
    ],
    questions: mcqQuestions.questions.map((question) => ({
      id: question.question_id,
      text: question.question_text,
      focus: "Agentic Guardrails",
      complexity: question.question_id % 2 === 0 ? "Medium" : "High",
      flag: question.question_id === 1 ? "review" : null,
    })),
    rubrics: [
      {
        label: "Architecture nuance",
        focus: "System Design",
        detail: "Evaluators articulate trade-offs between resilience, latency, and cost while referencing the target architecture.",
      },
      {
        label: "Agentic reasoning",
        focus: "Agentic Workflows",
        detail: "Candidate demonstrates how they scoped agentic humans-in-the-loop controls for high-impact tasks.",
      },
    ],
  },
  {
    id: "tpl-product-lead",
    role: "Product",
    seniority: "Mid",
    locked: false,
    title: "Discovery & Execution",
    status: "Draft",
    qualityScore: 78,
    generatedAt: "2025-12-01T09:15:00Z",
    skillWeights: [
      { label: "Problem Framing", weight: 34, category: "Product" },
      { label: "Stakeholder EQ", weight: 24, category: "Behavioral" },
      { label: "Roadmap Trade-offs", weight: 20, category: "Strategy" },
      { label: "Communication", weight: 22, category: "Soft Skill" },
    ],
    questions: [
      {
        id: 10,
        text: "How do you prioritize experiments when stakeholders disagree on market signals?",
        focus: "Stakeholder Management",
        complexity: "Medium",
        flag: null,
      },
      {
        id: 11,
        text: "Share an example of a product decision you reversed after user data surfaced new insights.",
        focus: "Product Judgment",
        complexity: "High",
        flag: "low",
      },
      {
        id: 12,
        text: "How do you keep engineering partners engaged while balancing new initiatives?",
        focus: "Collaboration",
        complexity: "Medium",
        flag: null,
      },
    ],
    rubrics: [
      {
        label: "Insight-led trade-offs",
        focus: "Problem Framing",
        detail: "Links qualitative/quantitative signals to decisions and shows how trade-offs informed sequencing.",
      },
      {
        label: "Execution empathy",
        focus: "Communication",
        detail: "Describes how they partnered with engineering and design through tough trade-offs.",
      },
    ],
  },
  {
    id: "tpl-ops-automation",
    role: "Operations",
    seniority: "Lead",
    locked: true,
    title: "Process Automation",
    status: "Locked",
    qualityScore: 88,
    generatedAt: "2025-11-27T14:40:00Z",
    skillWeights: [
      { label: "Process Ownership", weight: 36, category: "Operations" },
      { label: "Risk Awareness", weight: 26, category: "Compliance" },
      { label: "Change Leadership", weight: 20, category: "Behavioral" },
      { label: "Automation Strategy", weight: 18, category: "Execution" },
    ],
    questions: [
      {
        id: 21,
        text: "Describe how you measured the impact of an automation rollout.",
        focus: "Impact Metrics",
        complexity: "Medium",
        flag: null,
      },
      {
        id: 22,
        text: "How do you support teams through change when you introduce compliance guardrails?",
        focus: "Change Leadership",
        complexity: "High",
        flag: "review",
      },
      {
        id: 23,
        text: "What telemetry do you surface to catch regression in automated flows?",
        focus: "Observability",
        complexity: "High",
        flag: null,
      },
    ],
    rubrics: [
      {
        label: "Impact measurement",
        focus: "Process Ownership",
        detail: "Defines KPIs, adoption, and regression detection paired with corrective actions.",
      },
      {
        label: "Governance clarity",
        focus: "Risk Awareness",
        detail: "Highlights how risk matrices and playbooks keep automation safe.",
      },
    ],
  },
];

type FilterMode = "all" | "flagged";

const SuperAdminQuestions = () => {
  const [activeTemplateId, setActiveTemplateId] = useState(questionTemplates[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const activeTemplate =
    questionTemplates.find((template) => template.id === activeTemplateId) || questionTemplates[0];

  const filteredTemplates = questionTemplates.filter((template) => template.role === activeTemplate.role);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return activeTemplate.questions.filter((question) => {
      if (filterMode === "flagged" && !question.flag) {
        return false;
      }
      if (normalizedSearch.length === 0) {
        return true;
      }
      return (
        question.text.toLowerCase().includes(normalizedSearch) ||
        question.focus.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [activeTemplate.questions, filterMode, searchTerm]);

  const handleRoleClick = (templateId: string) => {
    setActiveTemplateId(templateId);
  };

  return (
    <div className="superadmin-questions">
      <div className="qa-header">
        <div>
          <p className="eyebrow">Question & Rubric Management</p>
          <h1>Guardrails for interview quality</h1>
        </div>
        <div className="header-actions">
          <button className="primary">Create template</button>
          <button>Lock core template</button>
          <button className="ghost">Flag question</button>
        </div>
      </div>

      <div className="split-grid">
        <aside className="sidebar">
          <section>
            <div className="panel-title">
              <h2>Roles & templates</h2>
              <span className="muted">Choose a template to inspect</span>
            </div>
            <ul className="role-list">
              {questionTemplates.map((template) => (
                <li key={template.id} className={activeTemplateId === template.id ? "active" : ""}>
                  <button type="button" onClick={() => handleRoleClick(template.id)}>
                    <div>
                      <strong>{template.role}</strong>
                      <small>{template.seniority}</small>
                    </div>
                    <span>{template.title}</span>
                    {template.locked && <span className="badge">Locked</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="panel-title">
              <h2>Skill taxonomy</h2>
              <span className="muted">Active weights</span>
            </div>
            <div className="skills">
              {activeTemplate.skillWeights.map((skill) => (
                <div key={skill.label} className="skill-row">
                  <div>
                    <strong>{skill.label}</strong>
                    <p className="muted">{skill.category}</p>
                  </div>
                  <span className="pill">{skill.weight}%</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="main-panel">
          <div className="panel-title">
            <div>
              <h2>Templates & rubrics</h2>
              <span className="muted">Role: {activeTemplate.role}</span>
            </div>
            <span className="muted">Updated {new Date(activeTemplate.generatedAt).toLocaleDateString()}</span>
          </div>
          <div className="templates">
            {filteredTemplates.map((template) => (
              <article key={template.id} className="template-card">
                <div>
                  <h3>{template.title}</h3>
                  <p>{template.seniority} · {template.status}</p>
                </div>
                <div className="template-meta">
                  <span>Quality {template.qualityScore}%</span>
                  <button className="ghost">Assign weight</button>
                </div>
              </article>
            ))}
          </div>

          <div className="filter-row">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search questions or skill focus"
            />
            <div className="filter-controls">
              <label>
                <input
                  type="radio"
                  name="filter"
                  checked={filterMode === "all"}
                  onChange={() => setFilterMode("all")}
                />
                Show all
              </label>
              <label>
                <input
                  type="radio"
                  name="filter"
                  checked={filterMode === "flagged"}
                  onChange={() => setFilterMode("flagged")}
                />
                Flagged only
              </label>
            </div>
          </div>

          <div className="questions-rubrics">
            <div className="question-list">
              <header>
                <div>
                  <h3>Role-approved questions</h3>
                  <p className="muted">{filteredQuestions.length} questions match filters</p>
                </div>
                <button className="primary">Preview flow</button>
              </header>
              <ul>
                {filteredQuestions.map((question) => (
                  <li key={question.id} className={question.flag ? "flagged" : ""}>
                    <div>
                      <p>{question.text}</p>
                      <small>{question.focus} · Complexity: {question.complexity}</small>
                    </div>
                    <div className="question-actions">
                      <button>Edit</button>
                      <button className="ghost">Flag low quality</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rubric-panel">
              <header>
                <h3>Rubrics</h3>
                <button>Assign skills</button>
              </header>
              <ul>
                {activeTemplate.rubrics.map((entry) => (
                  <li key={`${entry.label}-${entry.focus}`}>
                    <strong>{entry.label}</strong>
                    <p className="muted">{entry.focus}</p>
                    <p>{entry.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminQuestions;
