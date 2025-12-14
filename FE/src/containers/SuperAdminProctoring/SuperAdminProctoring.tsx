"use client";
import React, { useEffect, useMemo, useState } from "react";
import "./SuperAdminProctoring.scss";

const incidents = [
  {
    id: "incident-1",
    candidate: "Anya Patel",
    company: "Lumina AI",
    violationType: "Multiple faces detected",
    severity: "High",
    timestamp: "2025-12-12T14:22:33Z",
    status: "Under review",
    snapshots: ["snapshot-1.jpg", "snapshot-2.jpg", "snapshot-3.jpg"],
    timeline: [
      { time: "00:12", event: "Unauthorized screen share", detail: "Candidate opened a messaging app mid-session." },
      { time: "01:08", event: "Multiple faces", detail: "Secondary face detected in the bottom right corner." },
      { time: "02:45", event: "Audio spike", detail: "A different voice is heard for 4 seconds." },
    ],
    flags: ["Camera change", "Background noise", "Multiple faces"],
    override: "warning",
    notes: "Pending confirmation from candidate. Confirm if co-worker was present or if system spliced frames.",
  },
  {
    id: "incident-2",
    candidate: "Devon Reyes",
    company: "Pulse Grid",
    violationType: "Loss of proctor connection",
    severity: "Medium",
    timestamp: "2025-12-11T09:10:05Z",
    status: "Resolved",
    snapshots: ["snapshot-4.jpg", "snapshot-5.jpg"],
    timeline: [
      { time: "00:00", event: "Connection lost", detail: "Proctor disconnects due to network drop." },
      { time: "00:18", event: "Candidate reconnected", detail: "System auto resumes the feed." },
      { time: "00:32", event: "Delay warning", detail: "Flagged for potential tampering but cleared automatically." },
    ],
    flags: ["Network instability", "Delayed audio"],
    override: "valid",
    notes: "No manual intervention required; candidate reconnected within threshold." ,
  },
  {
    id: "incident-3",
    candidate: "Mara Santiago",
    company: "Cortex Atlas",
    violationType: "Refusal to share screen",
    severity: "High",
    timestamp: "2025-12-10T17:44:12Z",
    status: "Escalated",
    snapshots: ["snapshot-6.jpg", "snapshot-7.jpg", "snapshot-8.jpg"],
    timeline: [
      { time: "00:05", event: "Screen share denied", detail: "Candidate ignored the prompt for screen capture." },
      { time: "01:02", event: "Manual override", detail: "Admin asked candidate to explain refusal." },
      { time: "01:20", event: "Candidate muted", detail: "System flagged muted audio while host speaking." },
    ],
    flags: ["Screen share denied", "Muted audio"],
    override: "invalid",
    notes: "Escalated for compliance review. Document conversation log before invalidating the session.",
  },
];

type OverrideDecision = "valid" | "warning" | "invalid";

const decisionCopy: Record<OverrideDecision, string> = {
  valid: "Mark incident as cleared",
  warning: "Keep incident under observation",
  invalid: "Invalidate the session and rerun proctoring",
};

const SuperAdminProctoring = () => {
  const [selectedId, setSelectedId] = useState(incidents[0].id);
  const [overrideDecision, setOverrideDecision] = useState<OverrideDecision>(
    incidents[0].override as OverrideDecision
  );

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) ?? incidents[0],
    [selectedId]
  );

  useEffect(() => {
    setOverrideDecision(selectedIncident.override as OverrideDecision);
  }, [selectedIncident]);

  return (
    <div className="superadmin-proctoring">
      <div className="proctor-header">
        <div>
          <p className="eyebrow">Proctoring & Compliance</p>
          <h1>Review interview integrity incidents</h1>
        </div>
        <div className="header-actions">
          <button className="primary">Create incident</button>
          <button className="ghost">Download export</button>
        </div>
      </div>

      <div className="proctor-grid">
        <section className="incident-list">
          <header>
            <div>
              <h2>Incident queue</h2>
              <span className="muted">{incidents.length} total records · sorted by timestamp</span>
            </div>
            <button>Filter severity</button>
          </header>
          <ul>
            {incidents.map((incident) => (
              <li
                key={incident.id}
                className={selectedId === incident.id ? "active" : ""}
                onClick={() => setSelectedId(incident.id)}
              >
                <div>
                  <strong>{incident.candidate}</strong>
                  <span>{incident.company}</span>
                </div>
                <div className="incident-meta">
                  <span>{incident.violationType}</span>
                  <span className="severity">{incident.severity}</span>
                  <span>{new Date(incident.timestamp).toLocaleString()}</span>
                </div>
                <div className="status-chip">{incident.status}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="incident-detail">
          <div className="detail-header">
            <div>
              <h2>{selectedIncident.candidate}</h2>
              <span className="muted">{selectedIncident.company}</span>
            </div>
            <div className="detail-meta">
              <span>{selectedIncident.violationType}</span>
              <span className="severity">{selectedIncident.severity}</span>
              <span>{new Date(selectedIncident.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="snapshot-grid">
            <h3>Video snapshots</h3>
            <div className="snapshots">
              {selectedIncident.snapshots.map((snapshot) => (
                <div key={snapshot} className="snapshot">
                  <div className="snapshot-thumb" />
                  <small>{snapshot}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-panels">
            <article>
              <div className="panel-heading">
                <h4>Violation timeline</h4>
                <span className="muted">Chronological evidence</span>
              </div>
              <ul>
                {selectedIncident.timeline.map((event) => (
                  <li key={`${event.time}-${event.event}`}>
                    <strong>{event.time}</strong>
                    <div>
                      <p>{event.event}</p>
                      <small>{event.detail}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <div className="panel-heading">
                <h4>System flags</h4>
                <span className="muted">Automated sensors</span>
              </div>
              <div className="flags">
                {selectedIncident.flags.map((flag) => (
                  <span key={flag}>{flag}</span>
                ))}
              </div>
            </article>

            <article>
              <div className="panel-heading">
                <h4>Override decision</h4>
                <span className="muted">Choose final disposition</span>
              </div>
              <div className="decision-controls">
                {(Object.keys(decisionCopy) as OverrideDecision[]).map((decision) => (
                  <button
                    key={decision}
                    className={overrideDecision === decision ? "active" : ""}
                    onClick={() => setOverrideDecision(decision)}
                  >
                    <strong>{decision}</strong>
                    <small>{decisionCopy[decision]}</small>
                  </button>
                ))}
              </div>
            </article>

            <article>
              <div className="panel-heading">
                <h4>Admin notes</h4>
                <span className="muted">Recorded observations</span>
              </div>
              <p className="notes">{selectedIncident.notes}</p>
              <div className="note-actions">
                <button>Update note</button>
                <button className="ghost">Send to compliance</button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminProctoring;
