"use client";
import React from "react";
import "./AdminProctoringReview.scss";

type TimelineEntry = {
  time: string;
  detail: string;
  source?: string;
};

type Snapshot = {
  label: string;
  description: string;
};

const PROCTORING_RECORDS = [
  {
    candidate: "Serena Blake",
    job: "AI Research Engineer",
    violationType: "Multiple faces detected",
    severity: "High",
    status: "Warning",
    timeline: [
      {
        time: "10:02",
        detail: "Secondary face detected off-screen for 4s",
        source: "Camera 1",
      },
      {
        time: "10:10",
        detail: "System observed candidate looking away and screen sharing paused",
        source: "Browser event",
      },
      {
        time: "10:18",
        detail: "Interview resumed after 20s pause",
        source: "Session log",
      },
    ] as TimelineEntry[],
    snapshots: [
      {
        label: "Camera 1",
        description: "Blurred frame with second silhouette"
      },
      {
        label: "Browser tab",
        description: "Shared tab lost focus briefly"
      },
    ] as Snapshot[],
    notes: [
      "AI proctoring flagged secondary person in frame. No override permitted from admin view.",
      "Candidate confirmed the pause was due to a connection issue.",
    ],
  },
  {
    candidate: "Leah Murthy",
    job: "AI Research Engineer",
    violationType: "Background noise spike",
    severity: "Low",
    status: "Clean",
    timeline: [
      {
        time: "09:40",
        detail: "Ambient noise briefly exceeded threshold and triggered a warning",
        source: "Audio monitor",
      },
      {
        time: "09:42",
        detail: "Noise levels returned to acceptable range",
        source: "Audio monitor",
      },
    ] as TimelineEntry[],
    snapshots: [
      {
        label: "Audio waveform",
        description: "Spike recorded during 2s of applause"
      },
      {
        label: "Screenshot",
        description: "Candidate remained centered and compliant"
      },
    ] as Snapshot[],
    notes: [
      "Flag cleared automatically—no manual escalation required.",
      "Always read this page as view-only proof for compliance teams.",
    ],
  },
  {
    candidate: "Nikhil Varma",
    job: "Product Delivery Manager",
    violationType: "Screen sharing blocked",
    severity: "Medium",
    status: "Flagged",
    timeline: [
      {
        time: "11:05",
        detail: "Attempted to share screen but access denied repeatedly",
        source: "Session log",
      },
      {
        time: "11:07",
        detail: "Candidate opened unauthorized application",
        source: "Screen capture",
      },
      {
        time: "11:09",
        detail: "Proctoring paused the session and alerted the compliance queue",
        source: "Compliance webhook",
      },
    ] as TimelineEntry[],
    snapshots: [
      {
        label: "Screen view",
        description: "Unauthorized app window briefly visible"
      },
      {
        label: "Thumbnail",
        description: "Proctoring overlay captured attempt"
      },
    ] as Snapshot[],
    notes: [
      "Flag requires compliance follow-up—no admin override available.",
      "Candidate referred to a live integrity review.",
    ],
  },
];

const AdminProctoringReview = () => {
  const [selectedCandidate, setSelectedCandidate] = React.useState(PROCTORING_RECORDS[0].candidate);
  const selectedRecord =
    PROCTORING_RECORDS.find((record) => record.candidate === selectedCandidate) ?? PROCTORING_RECORDS[0];

  const handleSelect = (candidate: string) => {
    setSelectedCandidate(candidate);
  };

  return (
    <div className="admin-proctoring">
      <header className="page-header">
        <div>
          <p className="eyebrow">Compliance view</p>
          <h1>Proctoring review</h1>
          <p className="subhead">
            Read-only audit for admins—violations are recorded by the system and cannot be overridden from this view.
          </p>
        </div>
        <div className="status-stack">
          <span className={`status-pill ${selectedRecord.status.toLowerCase()}`}>{selectedRecord.status}</span>
          <p className="tiny">Severity: {selectedRecord.severity}</p>
          <p className="tiny">Violation: {selectedRecord.violationType}</p>
        </div>
      </header>

      <div className="proctoring-layout">
        <section className="panel list-panel card">
          <div className="panel-heading">
            <div>
              <h2>Violation log</h2>
              <p className="tiny">Latest interviews ordered by most recent review.</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="proctoring-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Violation type</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {PROCTORING_RECORDS.map((record) => (
                  <tr
                    key={record.candidate}
                    tabIndex={0}
                    role="button"
                    onClick={() => handleSelect(record.candidate)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleSelect(record.candidate);
                      }
                    }}
                    className={selectedRecord.candidate === record.candidate ? "is-active" : ""}
                  >
                    <td>
                      <strong>{record.candidate}</strong>
                    </td>
                    <td>
                      <span className="job-pill">{record.job}</span>
                    </td>
                    <td>{record.violationType}</td>
                    <td>
                      <span className={`severity severity-${record.severity.toLowerCase()}`}>{record.severity}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${record.status.toLowerCase()}`}>{record.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel detail-panel card">
          <div className="panel-heading">
            <div>
              <h2>{selectedRecord.candidate}</h2>
              <p className="tiny">{selectedRecord.job}</p>
            </div>
            <p className="detail-subhead">Timeline, snapshots, and notes are view-only evidence for the compliance team.</p>
          </div>

          <div className="timeline card">
            <h3>Timeline of violations</h3>
            <ul className="timeline-list">
              {selectedRecord.timeline.map((entry) => (
                <li key={`${selectedRecord.candidate}-${entry.time}`}>
                  <span className="time">{entry.time}</span>
                  <div>
                    <p className="event">{entry.detail}</p>
                    {entry.source && <p className="source">{entry.source}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="snapshot card">
            <h3>Snapshots</h3>
            <div className="snapshot-grid">
              {selectedRecord.snapshots.map((snapshot) => (
                <div key={snapshot.label} className="snapshot-card">
                  <div className="snapshot-placeholder">{snapshot.label}</div>
                  <p>{snapshot.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="notes card">
            <h3>Notes & comments</h3>
            <ul>
              {selectedRecord.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminProctoringReview;
