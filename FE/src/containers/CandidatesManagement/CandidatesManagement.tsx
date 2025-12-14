"use client";

import React, { useMemo, useState } from "react";
import {
  FiPlus,
  FiUpload,
  FiMail,
  FiClock,
  FiSliders,
} from "react-icons/fi";
import "./CandidatesManagement.scss";

interface CandidateRow {
  id: string;
  name: string;
  job: string;
  interviewStatus: string;
  score?: number;
  proctoring: string;
  invitedAt: string;
}

const CANDIDATE_DATA: CandidateRow[] = [
  {
    id: "cand-001",
    name: "Leah Murthy",
    job: "AI Research Engineer",
    interviewStatus: "Interviewing",
    score: undefined,
    proctoring: "Clear",
    invitedAt: "2025-12-02",
  },
  {
    id: "cand-002",
    name: "Nikhil Varma",
    job: "Product Delivery Manager",
    interviewStatus: "Scheduled",
    score: undefined,
    proctoring: "Clear",
    invitedAt: "2025-12-04",
  },
  {
    id: "cand-003",
    name: "Selina Ortega",
    job: "Platform Engineer",
    interviewStatus: "Completed",
    score: 88,
    proctoring: "Clear",
    invitedAt: "2025-11-29",
  },
  {
    id: "cand-004",
    name: "Ravi Patel",
    job: "Product Delivery Manager",
    interviewStatus: "Shortlisted",
    score: 91,
    proctoring: "Needs review",
    invitedAt: "2025-11-25",
  },
  {
    id: "cand-005",
    name: "Serena Blake",
    job: "AI Research Engineer",
    interviewStatus: "Rejected",
    score: 62,
    proctoring: "Flagged",
    invitedAt: "2025-11-18",
  },
  {
    id: "cand-006",
    name: "Jared Gill",
    job: "Platform Engineer",
    interviewStatus: "Invited",
    score: undefined,
    proctoring: "Pending",
    invitedAt: "2025-12-05",
  },
];

const statusOptions = [
  "Invited",
  "Scheduled",
  "Interviewing",
  "Completed",
  "Shortlisted",
  "Rejected",
];

const CandidatesManagement: React.FC = () => {
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const jobs = useMemo(() => Array.from(new Set(CANDIDATE_DATA.map((row) => row.job))), []);

  const filteredCandidates = useMemo(() => {
    return CANDIDATE_DATA.filter((row) => {
      const matchesJob = jobFilter ? row.job === jobFilter : true;
      const matchesStatus = statusFilter ? row.interviewStatus === statusFilter : true;
      const invitedDate = row.invitedAt;
      const afterFrom = dateFrom ? invitedDate >= dateFrom : true;
      const beforeTo = dateTo ? invitedDate <= dateTo : true;
      return matchesJob && matchesStatus && afterFrom && beforeTo;
    });
  }, [jobFilter, statusFilter, dateFrom, dateTo]);

  const interviewingRoster = useMemo(
    () => filteredCandidates.filter((row) => ["Interviewing", "Scheduled"].includes(row.interviewStatus)),
    [filteredCandidates]
  );

  const decisionRoster = useMemo(
    () => filteredCandidates.filter((row) => ["Shortlisted", "Completed"].includes(row.interviewStatus)),
    [filteredCandidates]
  );

  const proctoringAlerts = useMemo(
    () => filteredCandidates.filter((row) => row.proctoring !== "Clear"),
    [filteredCandidates]
  );

  const pipelineStats = useMemo(() => {
    const stats: Record<string, number> = {};
    CANDIDATE_DATA.forEach((row) => {
      const status = row.interviewStatus;
      stats[status] = (stats[status] || 0) + 1;
    });
    return stats;
  }, []);

  const clearLifecycleFilters = () => {
    setStatusFilter("");
    setJobFilter("");
  };

  return (
    <div className="candidates-management">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">Candidate pipeline</p>
          <h1>Manage interviews</h1>
          <p className="subhead">Control invites, proctoring flags, and lifecycle state for every open role.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-ghost" type="button">
            <FiClock /> Set deadlines
          </button>
          <button className="btn btn-secondary" type="button">
            <FiMail /> Send / resend links
          </button>
          <button className="btn btn-secondary" type="button">
            <FiUpload /> Upload CSV
          </button>
          <button className="btn btn-primary" type="button">
            <FiPlus /> Add candidate manually
          </button>
        </div>
      </header>

      <div className="management-grid">
        <aside className="sidebar sidebar-left">
          <div className="sidebar-card">
            <div className="card-heading">
              <span>Lifecycle filters</span>
              <button className="btn-link" type="button" onClick={clearLifecycleFilters}>
                Reset
              </button>
            </div>
            <div className="filter-group compact">
              <label>Job</label>
              <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
                <option value="">All roles</option>
                {jobs.map((job) => (
                  <option key={job} value={job}>
                    {job}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group compact">
              <label>Interview status</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Any stage</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-row">
              <div className="filter-group compact">
                <label>Invited from</label>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              </div>
              <div className="filter-group compact">
                <label>Invited to</label>
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
              </div>
            </div>
          </div>

          <div className="sidebar-card roster-card">
            <div className="card-heading">
              <span>Interviewing roster</span>
              <small>{interviewingRoster.length} active</small>
            </div>
            <ul>
              {interviewingRoster.map((row) => (
                <li key={row.id}>
                  <span>{row.name}</span>
                  <span className="badge">{row.interviewStatus}</span>
                </li>
              ))}
              {interviewingRoster.length === 0 && <li className="empty-roster">No active interviews</li>}
            </ul>
          </div>
        </aside>

        <section className="table-panel">
          <div className="filters-row">
            <div className="filter-group">
              <label>Job</label>
              <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
                <option value="">All roles</option>
                {jobs.map((job) => (
                  <option key={job} value={job}>
                    {job}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Interview status</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Any stage</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Invited from</label>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="filter-group">
              <label>Invited to</label>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
            <div className="filter-group short">
              <button className="btn btn-link" type="button" onClick={clearLifecycleFilters}>
                Clear candidate lifecycle states
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="candidates-table">
              <thead>
                <tr>
                  <th>Candidate name</th>
                  <th>Job applied for</th>
                  <th>Interview status</th>
                  <th>Score</th>
                  <th>Proctoring status</th>
                  <th>Invitation date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="candidate-cell">
                        <span className="candidate-name">{row.name}</span>
                        <span className="candidate-id">{row.id}</span>
                      </div>
                    </td>
                    <td>{row.job}</td>
                    <td>
                      <span className={`status-pill ${row.interviewStatus.toLowerCase().replace(/\s+/g, "-")}`}>
                        {row.interviewStatus}
                      </span>
                    </td>
                    <td>{row.score !== undefined ? `${row.score}%` : "—"}</td>
                    <td>{row.proctoring}</td>
                    <td>{row.invitedAt}</td>
                    <td>
                      <div className="action-stack">
                        <button className="btn btn-outline">View</button>
                        <button className="btn btn-outline">Resend link</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCandidates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      No candidates match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="sidebar sidebar-right">
          <div className="sidebar-card roster-card">
            <div className="card-heading">
              <span>Decision roster</span>
              <small>{decisionRoster.length} at decision</small>
            </div>
            <ul>
              {decisionRoster.map((row) => (
                <li key={row.id}>
                  <span>{row.name}</span>
                  <span className="badge">{row.interviewStatus}</span>
                </li>
              ))}
              {decisionRoster.length === 0 && <li className="empty-roster">Nothing in decision queue</li>}
            </ul>
          </div>

          <div className="sidebar-card roster-card">
            <div className="card-heading">
              <span>Proctoring watchlist</span>
              <small>{proctoringAlerts.length} alerts</small>
            </div>
            <ul>
              {proctoringAlerts.map((row) => (
                <li key={row.id}>
                  <span>{row.name}</span>
                  <span className="alert-icon">!</span>
                  <span className="badge alert">{row.proctoring}</span>
                </li>
              ))}
              {proctoringAlerts.length === 0 && <li className="empty-roster">No proctoring issues</li>}
            </ul>
          </div>

          <div className="sidebar-card stats-card">
            <div className="card-heading">
              <span>Pipeline stats</span>
            </div>
            <div className="stats-grid">
              {Object.entries(pipelineStats).map(([status, count]) => (
                <div key={status}>
                  <span>{status}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CandidatesManagement;
