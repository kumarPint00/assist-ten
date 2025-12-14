"use client";
import React, { useMemo, useState } from "react";
import "./SuperAdminInterviews.scss";

const sampleInterviews = [
  {
    id: "int-001",
    candidate: "Nisha Rao",
    company: "North Star Labs",
    type: "AI",
    status: "Completed",
    score: 84,
    proctoring: "OK",
    interviewDate: "2025-12-12T10:30:00Z",
    summary: "Technical interview focused on architecture, system design, and behavioural cues.",
    skillScores: [
      { skill: "Algorithms", value: 88 },
      { skill: "System Design", value: 81 },
      { skill: "Leadership", value: 79 },
    ],
    aiNotes: [
      "Confident explanation of distributed tracing",
      "Missed edge-case for multi-tenant isolation",
    ],
    proctorTimeline: [
      "00:00 — Candidate joined session",
      "10:14 — Camera disconnected (reconnected automatically)",
      "24:02 — Remote proctor raised verification alert",
      "42:10 — Session completed",
    ],
    finalDecision: "Consider",
    plan: "Enterprise",
    violations: false,
  },
  {
    id: "int-002",
    candidate: "Sanjay M.",
    company: "Arbor Ventures",
    type: "Human",
    status: "In review",
    score: 72,
    proctoring: "Under review",
    interviewDate: "2025-12-10T14:05:00Z",
    summary: "Live interview for customer success role.",
    skillScores: [
      { skill: "Communication", value: 79 },
      { skill: "Problem Solving", value: 76 },
      { skill: "Adaptability", value: 65 },
    ],
    aiNotes: [
      "Highlights candidate empathy",
      "Spoke about handling escalations with structure",
    ],
    proctorTimeline: [
      "00:00 — Interview launched",
      "14:40 — Candidate shared screen", 
      "29:22 — Proctor flagged possible violation (pending review)",
    ],
    finalDecision: "Hold",
    plan: "Growth",
    violations: true,
  },
  {
    id: "int-003",
    candidate: "Aria James",
    company: "Horizon Retail Group",
    type: "QnA",
    status: "Scheduled",
    score: null,
    proctoring: "Scheduled",
    interviewDate: "2025-12-18T09:00:00Z",
    summary: "Automated knowledge check for e-commerce operations.",
    skillScores: [
      { skill: "Product Knowledge", value: null },
      { skill: "Execution", value: null },
    ],
    aiNotes: ["Questions will be scored once candidate completes session."],
    proctorTimeline: ["Upcoming session — proctor assigned"],
    finalDecision: "Pending",
    plan: "Essentials",
    violations: false,
  },
];

const companyOptions = Array.from(new Set(sampleInterviews.map((row) => row.company)));
const typeOptions = ["AI", "Human", "QnA"];

const SuperAdminInterviews = () => {
  const [companyFilter, setCompanyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [violationsOnly, setViolationsOnly] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState(sampleInterviews[0].id);

  const filteredInterviews = useMemo(() => {
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;

    return sampleInterviews.filter((interview) => {
      if (companyFilter !== "all" && interview.company !== companyFilter) {
        return false;
      }
      if (typeFilter !== "all" && interview.type !== typeFilter) {
        return false;
      }
      if (violationsOnly && !interview.violations) {
        return false;
      }
      const interviewDate = new Date(interview.interviewDate);
      if (fromDate && interviewDate < fromDate) {
        return false;
      }
      if (toDate && interviewDate > toDate) {
        return false;
      }
      return true;
    });
  }, [companyFilter, typeFilter, dateRange, violationsOnly]);

  const selectedInterview =
    filteredInterviews.find((row) => row.id === selectedInterviewId) ?? sampleInterviews[0];

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="superadmin-interviews">
      <div className="interviews-header">
        <div>
          <p className="eyebrow">Interviews</p>
          <h1>Global interview monitor</h1>
        </div>
        <div className="header-actions">
          <button type="button">Bulk review</button>
          <button type="button" className="primary">Create flag</button>
        </div>
      </div>

      <div className="filter-row">
        <label>
          Company
          <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}>
            <option value="all">All companies</option>
            {companyOptions.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </label>
        <label>
          Interview type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="range">
          Date range
          <div className="date-inputs">
            <input
              type="date"
              value={dateRange.from}
              onChange={(event) => setDateRange({ ...dateRange, from: event.target.value })}
            />
            <span>—</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(event) => setDateRange({ ...dateRange, to: event.target.value })}
            />
          </div>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={violationsOnly}
            onChange={(event) => setViolationsOnly(event.target.checked)}
          />
          Show violations only
        </label>
      </div>

      <div className="content-grid">
        <div className="table-panel">
          <div className="table-headline">
            <div>
              <p className="eyebrow">Investigation table</p>
              <h2>All interviews</h2>
            </div>
            <span>{filteredInterviews.length} rows</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Company</th>
                  <th>Interview type</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Proctoring</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((interview) => (
                  <tr
                    key={interview.id}
                    className={selectedInterviewId === interview.id ? "active-row" : ""}
                    onClick={() => setSelectedInterviewId(interview.id)}
                  >
                    <td>
                      <strong>{interview.candidate}</strong>
                    </td>
                    <td>{interview.company}</td>
                    <td>{interview.type}</td>
                    <td>{interview.status}</td>
                    <td>{interview.score ?? "—"}</td>
                    <td>{interview.proctoring}</td>
                    <td>{formatDate(interview.interviewDate)}</td>
                    <td>
                      <div className="actions-row">
                        <button type="button">View report</button>
                        <button type="button" className="ghost">
                          Review proctoring
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInterviews.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      No interviews match the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="detail-panel">
          <div className="detail-card">
            <div className="detail-header">
              <div>
                <p className="eyebrow">Interview summary</p>
                <h3>{selectedInterview.candidate}</h3>
              </div>
              <span className={`status-chip ${selectedInterview.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {selectedInterview.status}
              </span>
            </div>
            <p className="muted">{selectedInterview.summary}</p>
            <div className="detail-meta">
              <div>
                <p className="label">Company</p>
                <strong>{selectedInterview.company}</strong>
              </div>
              <div>
                <p className="label">Interview type</p>
                <strong>{selectedInterview.type}</strong>
              </div>
              <div>
                <p className="label">Date</p>
                <strong>{formatDate(selectedInterview.interviewDate)}</strong>
              </div>
              <div>
                <p className="label">Score</p>
                <strong>{selectedInterview.score ?? "—"}</strong>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h4>Scores by skill</h4>
            <div className="skill-grid">
              {selectedInterview.skillScores.map((skill) => (
                <div key={skill.skill} className="skill-row">
                  <div>
                    <strong>{skill.skill}</strong>
                    <div className="muted">Detailed rating</div>
                  </div>
                  <span>{skill.value ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-card">
            <h4>AI evaluation notes</h4>
            <ul className="note-list">
              {selectedInterview.aiNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <div className="detail-card">
            <h4>Proctoring timeline</h4>
            <div className="timeline">
              {selectedInterview.proctorTimeline.map((entry) => (
                <div key={entry} className="timeline-row">
                  <span>{entry}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-card final-decision">
            <h4>Final decision</h4>
            <div className="decision-pill">{selectedInterview.finalDecision}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminInterviews;