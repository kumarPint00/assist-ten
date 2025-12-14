"use client";
import React, { useMemo, useState } from "react";
import "./SuperAdminIncidents.scss";

const incidents = [
  {
    id: "inc-1",
    tenant: "Lumina AI",
    failedAiCalls: 42,
    retrySpike: 1.8,
    suspiciousInterviews: 6,
    apiAbuse: "mass inference",
    violationType: "Failed AI call surge",
    severity: "High",
    timestamp: "2025-12-12T14:22:33Z",
    status: "Investigating",
    description: "LLM inference failures hit 42 in 5m window; correlates with simultaneous webhook spikes.",
    alerts: [
      "LLM timeout on /generate-mcqs",
      "Webhook replays detected",
      "Multiple job descriptions retried"
    ],
    timeline: [
      { time: "14:15", event: "LLM request 502", detail: "Cascade from new tenant script" },
      { time: "14:18", event: "Retry throttle activated", detail: "Retry multiplier reached 3x" },
      { time: "14:25", event: "Failure rate 87%", detail: "Cloudwatch alarm fired" }
    ],
    notes: "Need to limit new release. Awaiting SRE confirmation before blocking.",
  },
  {
    id: "inc-2",
    tenant: "Pulse Grid",
    failedAiCalls: 8,
    retrySpike: 0.6,
    suspiciousInterviews: 2,
    apiAbuse: "credential stuffing",
    violationType: "Retry spike",
    severity: "Medium",
    timestamp: "2025-12-11T09:10:05Z",
    status: "Mitigated",
    description: "Observed 1.6x retry rate on fee-based interview endpoints after repeated login failures.",
    alerts: [
      "Auth retry detection",
      "Candidate-session burst",
      "API token reuse"
    ],
    timeline: [
      { time: "09:05", event: "Auth retries +45%", detail: "Automation detected from 3 IPs" },
      { time: "09:08", event: "Usage throttle engaged", detail: "Limited interview start" },
      { time: "09:20", event: "Spike declined", detail: "Back to baseline" }
    ],
    notes: "Tenant blocked on UI for 2h; monitored spikes cleared automatically.",
  },
  {
    id: "inc-3",
    tenant: "Cortex Atlas",
    failedAiCalls: 16,
    retrySpike: 0.9,
    suspiciousInterviews: 4,
    apiAbuse: "batch job abuse",
    violationType: "Suspicious interview patterns",
    severity: "Warning",
    timestamp: "2025-12-10T17:44:12Z",
    status: "Escalated",
    description: "Multiple interviews orchestrated without proctoring; audio minutes outpace historical average.",
    alerts: [
      "Interview duration ending early",
      "Audio-minute spike",
      "No proctor handshake"
    ],
    timeline: [
      { time: "17:40", event: "Interview count up", detail: "10 interviews queued in 3 min" },
      { time: "17:42", event: "System flag: unattended", detail: "No background check submitted" },
      { time: "17:48", event: "Compliance review", detail: "Session paused for manual audit" }
    ],
    notes: "Need to block interview mode for this tenant until compliance review closes.",
  },
];

const actionItems = [
  { id: "block", title: "Block tenant", desc: "Prevent new sessions until incident closed" },
  { id: "throttle", title: "Throttle usage", desc: "Limit interview starts to cool down APIs" },
  { id: "disable", title: "Disable interview modes", desc: "Disable live interview and questionnaire modes" },
  { id: "note", title: "Add internal notes", desc: "Write context for on-call responders" },
];

const severityTone: Record<string, string> = {
  High: "#f97316",
  Medium: "#facc15",
  Warning: "#1c5dff",
};

const SuperAdminIncidents = () => {
  const [selected, setSelected] = useState(incidents[0].id);
  const [activeAction, setActiveAction] = useState(actionItems[0].id);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selected) ?? incidents[0],
    [selected]
  );

  return (
    <div className="superadmin-incidents">
      <header className="incidents-header">
        <div>
          <p className="eyebrow">Incidents & Abuse</p>
          <h1>Detect misuse and act before it spreads</h1>
          <p className="muted">Alerts combine AI failures, retry spikes, and API indicators so you can prioritize interventions.</p>
        </div>
      </header>

      <div className="incidents-grid">
        <section className="incident-list">
          <header>
            <div>
              <h2>Alerts queue</h2>
              <span className="muted">{incidents.length} active investigations · sorted by severity</span>
            </div>
            <button>Export incident</button>
          </header>
          <ul>
            {incidents.map((incident) => (
              <li
                key={incident.id}
                className={selected === incident.id ? "active" : ""}
                onClick={() => setSelected(incident.id)}
              >
                <div>
                  <strong>{incident.tenant}</strong>
                  <span>{incident.description}</span>
                </div>
                <div className="incident-meta">
                  <span className="severity" style={{ color: severityTone[incident.severity] }}>{incident.severity}</span>
                  <span>{incident.violationType}</span>
                  <span>{new Date(incident.timestamp).toLocaleString()}</span>
                </div>
                <div className="status">{incident.status}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="incident-detail">
          <div className="detail-header">
            <div>
              <h2>{selectedIncident.tenant}</h2>
              <span className="muted">{selectedIncident.violationType}</span>
            </div>
            <div className="severity" style={{ color: severityTone[selectedIncident.severity] }}>
              {selectedIncident.severity}
            </div>
          </div>

          <div className="detail-row">
            <article>
              <h3>Failed AI calls</h3>
              <p className="metric">{selectedIncident.failedAiCalls}</p>
              <p className="muted">Requests that returned errors in last hour</p>
            </article>
            <article>
              <h3>Retry spike</h3>
              <p className="metric">{selectedIncident.retrySpike.toFixed(1)}x baseline</p>
              <p className="muted">Triggered when retries go above 1.2x</p>
            </article>
            <article>
              <h3>Suspicious interviews</h3>
              <p className="metric">{selectedIncident.suspiciousInterviews}</p>
              <p className="muted">Detected without proctoring or suspicious durations</p>
            </article>
            <article>
              <h3>API abuse</h3>
              <p className="metric">{selectedIncident.apiAbuse}</p>
              <p className="muted">Indicator used for decisioning</p>
            </article>
          </div>

          <div className="alerts">
            <h3>Recent alerts</h3>
            <ul>
              {selectedIncident.alerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          </div>

          <div className="timeline">
            <h3>Violation timeline</h3>
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
          </div>

          <div className="actions">
            <h3>Actions</h3>
            <div className="action-grid">
              {actionItems.map((action) => (
                <button
                  key={action.id}
                  className={activeAction === action.id ? "active" : ""}
                  onClick={() => setActiveAction(action.id)}
                >
                  <strong>{action.title}</strong>
                  <small>{action.desc}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="notes">
            <h3>Internal notes</h3>
            <p>{selectedIncident.notes}</p>
            <div className="note-actions">
              <button className="primary">Add note</button>
              <button className="ghost">Attach log</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminIncidents;
