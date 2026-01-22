"use client";
import React, { useMemo, useState, useEffect } from "react";
import { superadminService } from "../../API/services";
import "./SuperAdminInterviews.scss";

// Interviews are loaded from the API via interviewerService

const typeOptions = ["AI", "Human", "QnA"];

type InterviewRow = any;

const SuperAdminInterviews = () => {
  const [companyFilter, setCompanyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [violationsOnly, setViolationsOnly] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyOptions, setCompanyOptions] = useState<string[]>([]);

  const filteredInterviews = useMemo(() => {
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;

    return interviews.filter((interview) => {
      if (companyFilter !== "all" && interview.company !== companyFilter) {
        return false;
      }
      if (typeFilter !== "all" && interview.interview_type !== typeFilter && interview.type !== typeFilter) {
        return false;
      }
      if (violationsOnly && !interview.violations) {
        return false;
      }
      const interviewDate = interview.scheduled_at ? new Date(interview.scheduled_at) : interview.interviewDate ? new Date(interview.interviewDate) : null;
      if (fromDate && interviewDate && interviewDate < fromDate) {
        return false;
      }
      if (toDate && interviewDate && interviewDate > toDate) {
        return false;
      }
      return true;
    });
  }, [companyFilter, typeFilter, dateRange, violationsOnly, interviews]);

  const selectedInterview =
    filteredInterviews.find((row) => row.id === selectedInterviewId || row.interview_id === selectedInterviewId) ?? filteredInterviews[0] ?? null;

  const formatDate = (value: string | null) => {
    if (!value) return "—";
  // If there are no interviews, show an empty state instead of crashing
  if (!selectedInterview && filteredInterviews.length === 0) {
    return (
      <div className="superadmin-interviews">
        <div className="interviews-header">
          <div>
            <p className="eyebrow">Interviews</p>
            <h1>Global interview monitor</h1>
          </div>
        </div>
        <div className="empty-state">
          <h3>No interviews found</h3>
          <p className="muted">There are no interviews available for your account or the current filters — try widening the filters or seed sample interviews.</p>
        </div>
      </div>
    );
  }
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch system-wide interviews via superadmin API
        const res = await superadminService.listInterviews(200);
        if (!mounted) return;
        // Map to a common shape used by the UI where possible
        const mapped = (res || []).map((r: any) => ({
          id: r.interview_id || r.id,
          interview_id: r.interview_id || r.id,
          candidate: r.candidate_name || r.candidate_id || "—",
          company: r.company || r.requisition_title || "—",
          type: r.interview_type || r.type || "—",
          interview_type: r.interview_type || r.type || "—",
          status: r.status || "—",
          score: r.score ?? null,
          proctoring: r.proctoring_status || "—",
          interviewDate: r.scheduled_at || r.interview_date || null,
          summary: r.summary || r.preparation_notes || "",
          skillScores: r.skill_scores || [],
          aiNotes: r.ai_notes || [],
          proctorTimeline: r.proctoring_timeline || [],
          finalDecision: r.final_decision || "",
          plan: r.plan || "",
          violations: r.violations || false,
        }));
        setInterviews(mapped);
        setCompanyOptions(Array.from(new Set(mapped.map((m: any) => m.company).filter(Boolean))));
        if (mapped.length > 0 && !selectedInterviewId) setSelectedInterviewId(mapped[0].id);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.detail || "Failed to load interviews");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

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
          {!selectedInterview ? (
            <div className="detail-card empty-detail">
              <h3>No interview selected</h3>
              <p className="muted">Select an interview from the left to view details.</p>
            </div>
          ) : (
            <>
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
                  {Array.isArray(selectedInterview.skillScores) && selectedInterview.skillScores.length > 0 ? (
                    selectedInterview.skillScores.map((skill: { skill: string; value?: number | null }) => (
                      <div key={skill.skill} className="skill-row">
                        <div>
                          <strong>{skill.skill}</strong>
                          <div className="muted">Detailed rating</div>
                        </div>
                        <span>{skill.value ?? "—"}</span>
                      </div>
                    ))
                  ) : (
                    <div className="muted">No skill scores available</div>
                  )}
                </div>
              </div>

              <div className="detail-card">
                <h4>AI evaluation notes</h4>
                <ul className="note-list">
                  {Array.isArray(selectedInterview.aiNotes) && selectedInterview.aiNotes.length > 0 ? (
                    selectedInterview.aiNotes.map((note: string) => <li key={note}>{note}</li>)
                  ) : (
                    <li className="muted">No notes available</li>
                  )}
                </ul>
              </div>

              <div className="detail-card">
                <h4>Proctoring timeline</h4>
                <div className="timeline">
                  {Array.isArray(selectedInterview.proctorTimeline) && selectedInterview.proctorTimeline.length > 0 ? (
                    selectedInterview.proctorTimeline.map((entry: string) => (
                      <div key={entry} className="timeline-row">
                        <span>{entry}</span>
                      </div>
                    ))
                  ) : (
                    <div className="muted">No timeline events</div>
                  )}
                </div>
              </div>

              <div className="detail-card final-decision">
                <h4>Final decision</h4>
                <div className="decision-pill">{selectedInterview.finalDecision}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminInterviews;