"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import "./AdminResults.scss";

interface SkillScore {
  skill: string;
  score: number;
  confidence: string;
}

interface ResultRecord {
  candidate: string;
  role: string;
  overallScore: number;
  status: "Pass" | "Fail" | "Borderline";
  proctoring: string;
  aiSummary: string;
  strengths: string[];
  weaknesses: string[];
  skillBreakdown: SkillScore[];
  comparison: { candidate: string; score: number }[];
  interviewDate: string;
}

const RESULTS: Record<string, ResultRecord> = {
  "Serena Blake": {
    candidate: "Serena Blake",
    role: "AI Research Engineer",
    overallScore: 91,
    status: "Pass",
    proctoring: "Clear",
    aiSummary:
      "Serena demonstrated deep ownership of the LLM question pipeline and structured responses with passing detail. Weakest area is prompt-level evaluation planning.",
    strengths: ["LLM prompt engineering", "Data-driven storytelling", "System design collaboration"],
    weaknesses: ["Needs polish on low-latency inference debugging", "Minimal visibility into deployment handoff"],
    skillBreakdown: [
      { skill: "Python", score: 98, confidence: "High" },
      { skill: "Reasoning", score: 92, confidence: "Medium" },
      { skill: "Prompt Engineering", score: 88, confidence: "High" },
      { skill: "Communication", score: 85, confidence: "Medium" },
    ],
    comparison: [
      { candidate: "Leah Murthy", score: 88 },
      { candidate: "Nikhil Varma", score: 82 },
    ],
    interviewDate: "2025-12-05",
  },
  "Leah Murthy": {
    candidate: "Leah Murthy",
    role: "AI Research Engineer",
    overallScore: 88,
    status: "Borderline",
    proctoring: "Clear",
    aiSummary:
      "Leah shows strong research instincts but needs sharper closing against ambiguous product problems. Summary leans on collaboration artifacts.",
    strengths: ["Research rigor", "Statistical intuition"],
    weaknesses: ["Closing on ambiguous requirements", "Needs sharper data storytelling"],
    skillBreakdown: [
      { skill: "Research", score: 90, confidence: "High" },
      { skill: "Python", score: 84, confidence: "Medium" },
      { skill: "Collaboration", score: 80, confidence: "Medium" },
      { skill: "Bias mitigation", score: 76, confidence: "Low" },
    ],
    comparison: [
      { candidate: "Serena Blake", score: 91 },
      { candidate: "Nikhil Varma", score: 82 },
    ],
    interviewDate: "2025-12-02",
  },
  "Nikhil Varma": {
    candidate: "Nikhil Varma",
    role: "Product Delivery Manager",
    overallScore: 82,
    status: "Fail",
    proctoring: "Clear",
    aiSummary:
      "Solid operational instincts but lacks depth on AI tool design. Score reflects some incoherence in reasoning under pressure.",
    strengths: ["Program delivery", "Stakeholder communication"],
    weaknesses: ["AI architecture fluency", "Depth on automation metrics"],
    skillBreakdown: [
      { skill: "Delivery", score: 85, confidence: "High" },
      { skill: "Communication", score: 83, confidence: "High" },
      { skill: "AI systems", score: 74, confidence: "Medium" },
      { skill: "Metrics", score: 71, confidence: "Low" },
    ],
    comparison: [
      { candidate: "Serena Blake", score: 91 },
      { candidate: "Leah Murthy", score: 88 },
    ],
    interviewDate: "2025-12-12",
  },
};

const AdminResults = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCandidate = "Serena Blake";
  const candidateFromParam = searchParams.get("candidate") ?? "";
  const result = RESULTS[candidateFromParam] ?? RESULTS[defaultCandidate];
  const candidateList = React.useMemo(() => Object.values(RESULTS), []);
  const [filterTerm, setFilterTerm] = React.useState("");

  const filteredCandidates = React.useMemo(() => {
    if (!filterTerm.trim()) return candidateList;
    const normalized = filterTerm.toLowerCase();
    return candidateList.filter(
      (record) =>
        record.candidate.toLowerCase().includes(normalized) ||
        record.role.toLowerCase().includes(normalized)
    );
  }, [candidateList, filterTerm]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<ResultRecord["status"], number> = {
      Pass: 0,
      Borderline: 0,
      Fail: 0,
    };
    candidateList.forEach((record) => {
      counts[record.status] += 1;
    });
    return counts;
  }, [candidateList]);

  const handleSelect = (candidate: string) => {
    router.push(`/admin/results?candidate=${encodeURIComponent(candidate)}`);
  };

  return (
    <div className="admin-results">
      <header className="results-header">
        <div>
          <p className="eyebrow">Candidate reports</p>
          <h1>Results for {result.candidate}</h1>
          <p className="subhead">
            Admins observe AI-assisted evaluations, review strengths & weaknesses, and take pass/fail decisions with
            supporting summaries and proctoring proof from {result.interviewDate}.
          </p>
        </div>
        <div className="result-pill">
          <span className="score-label">Overall score</span>
          <strong>{result.overallScore}%</strong>
          <span className={`status-indicator ${result.status.toLowerCase()}`}>{result.status}</span>
        </div>
      </header>

      <div className="results-management">
        <aside className="results-list card">
          <div className="list-header">
            <div>
              <h2>All candidate reports</h2>
              <p className="tiny">
                {candidateList.length} interviews • {statusCounts.Pass} pass • {statusCounts.Borderline} borderline •{' '}
                {statusCounts.Fail} fail
              </p>
            </div>
            <input
              className="filter-input"
              placeholder="Search name or role"
              value={filterTerm}
              onChange={(event) => setFilterTerm(event.target.value)}
            />
          </div>
          <div className="list-body">
            {filteredCandidates.map((record) => (
              <button
                key={record.candidate}
                type="button"
                className={`candidate-row ${result.candidate === record.candidate ? "active" : ""}`}
                onClick={() => handleSelect(record.candidate)}
              >
                <div>
                  <strong>{record.candidate}</strong>
                  <p>{record.role}</p>
                  <p className="interview-date">Interviewed {record.interviewDate}</p>
                </div>
                <div className="row-meta">
                  <span className={`status-pill ${record.status.toLowerCase()}`}>{record.status}</span>
                  <strong className="score">{record.overallScore}%</strong>
                </div>
              </button>
            ))}
            {!filteredCandidates.length && (
              <p className="empty-state">No matches for “{filterTerm}”.</p>
            )}
          </div>
        </aside>

        <div className="results-main">
          <div className="results-grid">
            <section className="card summary-card">
              <div className="card-heading">
                <h2>Report snapshot</h2>
                <span className={`status-pill ${result.status.toLowerCase()}`}>{result.status}</span>
              </div>
              <div className="summary-row">
                <div>
                  <p className="label">Job</p>
                  <strong>{result.role}</strong>
                </div>
                <div>
                  <p className="label">Proctoring</p>
                  <strong>{result.proctoring}</strong>
                </div>
                <div>
                  <p className="label">Actions</p>
                  <div className="action-buttons">
                    <button className="btn btn-primary">Shortlist</button>
                    <button className="btn btn-outline">Reject</button>
                  </div>
                </div>
              </div>
            </section>

            <section className="card ai-card">
              <h2>AI Summary</h2>
              <p className="ai-summary">{result.aiSummary}</p>
              <div className="ai-meta">
                <span className="chip">Generated 3m ago</span>
                <span className="chip">Model: GPT-4.1</span>
              </div>
            </section>
          </div>

          <div className="skill-matrix card">
            <div className="card-heading">
              <h2>Skill breakdown</h2>
              <p className="tiny">Confidence bucket based on interview artifacts</p>
            </div>
            <div className="skill-table">
              {result.skillBreakdown.map((skill) => (
                <article key={skill.skill} className="skill-row">
                  <div>
                    <p className="label">{skill.skill}</p>
                    <strong>{skill.score}%</strong>
                  </div>
                  <span className={`confidence ${skill.confidence.toLowerCase()}`}>{skill.confidence}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="traits-grid">
            <section className="card strengths">
              <h2>Strengths</h2>
              <ul>
                {result.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            </section>
            <section className="card weaknesses">
              <h2>Weaknesses</h2>
              <ul>
                {result.weaknesses.map((weakness) => (
                  <li key={weakness}>{weakness}</li>
                ))}
              </ul>
            </section>
            <section className="card comparison">
              <h2>Compare candidates</h2>
              <div className="comparison-list">
                {result.comparison.map((candidate) => (
                  <div key={candidate.candidate} className="comparison-row">
                    <span>{candidate.candidate}</span>
                    <strong>{candidate.score}%</strong>
                  </div>
                ))}
              </div>
              <button className="btn btn-link" type="button">
                Export report (PDF)
              </button>
            </section>
          </div>

          <footer className="results-footer">
            <div className="proctoring-card">
              <h3>Proctoring status</h3>
              <p>The session remained {result.proctoring.toLowerCase()} throughout. No anomalies detected.</p>
            </div>
            <div className="decision-actions">
              <button className="btn btn-ghost">Share internally</button>
              <button className="btn btn-primary">Shortlist candidate</button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AdminResults;
