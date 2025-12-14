"use client";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import "./AdminInterviews.scss";

interface InterviewRecord {
  id: string;
  candidate: string;
  role: string;
  type: "QnA" | "AI" | "Human";
  status: "Scheduled" | "In progress" | "Completed";
  duration: string;
  score?: number;
  date: string;
}

const INTERVIEWS: InterviewRecord[] = [
  {
    id: "int-001",
    candidate: "Leah Murthy",
    role: "AI Research Engineer",
    type: "AI",
    status: "Scheduled",
    duration: "30m",
    score: undefined,
    date: "2025-12-15",
  },
  {
    id: "int-002",
    candidate: "Selina Ortega",
    role: "Platform Engineer",
    type: "Human",
    status: "Completed",
    duration: "45m",
    score: 88,
    date: "2025-12-10",
  },
  {
    id: "int-003",
    candidate: "Nikhil Varma",
    role: "Product Delivery Manager",
    type: "QnA",
    status: "In progress",
    duration: "27m",
    score: 79,
    date: "2025-12-12",
  },
  {
    id: "int-004",
    candidate: "Ravi Patel",
    role: "Platform Engineer",
    type: "Human",
    status: "Scheduled",
    duration: "35m",
    score: undefined,
    date: "2025-12-14",
  },
  {
    id: "int-005",
    candidate: "Serena Blake",
    role: "AI Research Engineer",
    type: "AI",
    status: "Completed",
    duration: "32m",
    score: 91,
    date: "2025-12-05",
  },
];

const jobOptions = Array.from(new Set(INTERVIEWS.map((record) => record.role)));

const AdminInterviews = () => {
  const [jobFilter, setJobFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<InterviewRecord["type"] | "">("");
  const [statusFilter, setStatusFilter] = useState<InterviewRecord["status"] | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredInterviews = useMemo(() => {
    return INTERVIEWS.filter((record) => {
      const matchesJob = jobFilter ? record.role === jobFilter : true;
      const matchesType = typeFilter ? record.type === typeFilter : true;
      const matchesStatus = statusFilter ? record.status === statusFilter : true;
      const matchesFrom = dateFrom ? record.date >= dateFrom : true;
      const matchesTo = dateTo ? record.date <= dateTo : true;
      return matchesJob && matchesType && matchesStatus && matchesFrom && matchesTo;
    });
  }, [jobFilter, typeFilter, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setJobFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const statusSummary = useMemo(() => {
    const map: Record<InterviewRecord["status"], number> = {
      Scheduled: 0,
      "In progress": 0,
      Completed: 0,
    };
    INTERVIEWS.forEach((record) => {
      map[record.status] += 1;
    });
    return map;
  }, []);

  return (
    <div className="admin-interviews">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">Interview oversight</p>
          <h1>Track every interview</h1>
          <p className="subhead">Admin observers can see schedule, type, duration, score, and launch the report without participating.</p>
        </div>
        <div className="heading-stats">
          {Object.entries(statusSummary).map(([status, count]) => (
            <div key={status} className="stat">
              <span>{status}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </header>

      <div className="filter-panel">
        <div className="filter-group">
          <label>Job role</label>
          <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
            <option value="">All roles</option>
            {jobOptions.map((job) => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Interview type</label>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as InterviewRecord["type"] | "")}
          >
            <option value="">Any type</option>
            <option value="QnA">QnA</option>
            <option value="AI">AI</option>
            <option value="Human">Human</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as InterviewRecord["status"] | "")}
          >
            <option value="">Any status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In progress">In progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Date from</label>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </div>
        <div className="filter-group">
          <label>Date to</label>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
        <div className="filter-group action-group">
          <button className="btn btn-link" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="interviews-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Job role</th>
              <th>Interview type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInterviews.map((record) => (
              <tr key={record.id}>
                <td>
                  <div className="candidate-cell">
                    <strong>{record.candidate}</strong>
                    <span className="tiny">{record.id}</span>
                  </div>
                </td>
                <td>{record.role}</td>
                <td>{record.type}</td>
                <td>
                  <span className={`status-pill ${record.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {record.status}
                  </span>
                </td>
                <td>{record.date}</td>
                <td>{record.duration}</td>
                <td>{record.score !== undefined ? `${record.score}%` : "—"}</td>
                <td>
                  <Link href={`/admin/results?candidate=${encodeURIComponent(record.candidate)}`}>
                    <button className="btn btn-outline" type="button">
                      View report
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
            {filteredInterviews.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  No interviews match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInterviews;
