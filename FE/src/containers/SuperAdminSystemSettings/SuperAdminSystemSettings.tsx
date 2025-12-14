"use client";
import React from "react";
import "./SuperAdminSystemSettings.scss";

const featureFlags = [
  { key: "agentic-playbooks", label: "Agentic Playbooks", value: true },
  { key: "auto-proctoring", label: "Auto proctoring", value: false },
  { key: "ai-voice-analysis", label: "AI Voice analysis", value: true },
];

const rateLimits = [
  { key: "api", label: "API requests per minute", value: "1200" },
  { key: "interviews", label: "Concurrent interviews", value: "35" },
  { key: "webhooks", label: "Webhook retries", value: "3" },
];

const fallbackModes = [
  { key: "llm", label: "LLM fallback", current: "Groq" },
  { key: "session", label: "Session routing", current: "Regionally isolated" },
];

const notifications = [
  { key: "incident", label: "Incident alerts", value: true },
  { key: "billing", label: "Billing reminders", value: false },
  { key: "audit", label: "Audit log exports", value: true },
];

const roles = [
  { key: "admin", label: "Admin access", permissions: ["Manage tenants", "View usage", "Edit templates"] },
  { key: "observer", label: "Observer", permissions: ["View dashboards", "Read-only logs"] },
  { key: "support", label: "Support", permissions: ["Chat assistance", "Issue creation"] },
];

const SuperAdminSystemSettings = () => {
  return (
    <div className="superadmin-settings">
      <header className="settings-header">
        <div>
          <p className="eyebrow">System Settings</p>
          <h1>Control platform behavior for every tenant</h1>
          <p className="muted">Feature flags, rate limits, LLM fallback, and maintenance settings stay synced across regions.</p>
        </div>
        <div className="header-actions">
          <button className="ghost">Rollback</button>
          <button className="primary">Save settings</button>
        </div>
      </header>

      <section className="sections-grid">
        <article>
          <div className="section-title">
            <h2>Feature flags</h2>
            <p className="muted">Toggle gradual rollouts</p>
          </div>
          <div className="toggle-list">
            {featureFlags.map((flag) => (
              <label key={flag.key} className="toggle-row">
                <span>{flag.label}</span>
                <input type="checkbox" defaultChecked={flag.value} />
              </label>
            ))}
          </div>
        </article>

        <article>
          <div className="section-title">
            <h2>Rate limits</h2>
            <p className="muted">Adjust usage ceilings globally</p>
          </div>
          <div className="input-grid">
            {rateLimits.map((limit) => (
              <label key={limit.key}>
                <span className="input-label">{limit.label}</span>
                <input type="text" defaultValue={limit.value} />
              </label>
            ))}
          </div>
        </article>

        <article>
          <div className="section-title">
            <h2>LLM & maintenance</h2>
            <p className="muted">Fallbacks and downtime mode</p>
          </div>
          <div className="llm-panel">
            {fallbackModes.map((mode) => (
              <div key={mode.key}>
                <strong>{mode.label}</strong>
                <p className="muted">Current: {mode.current}</p>
              </div>
            ))}
            <label className="toggle-row maintenance">
              <span>Maintenance mode</span>
              <input type="checkbox" defaultChecked={false} />
            </label>
          </div>
        </article>

        <article>
          <div className="section-title">
            <h2>Notifications</h2>
            <p className="muted">Control alerting matrix</p>
          </div>
          <div className="toggle-list">
            {notifications.map((notification) => (
              <label key={notification.key} className="toggle-row">
                <span>{notification.label}</span>
                <input type="checkbox" defaultChecked={notification.value} />
              </label>
            ))}
          </div>
        </article>

        <article className="roles-panel">
          <div className="section-title">
            <h2>Roles & permissions</h2>
            <p className="muted">See who can change what</p>
          </div>
          <ul>
            {roles.map((role) => (
              <li key={role.key}>
                <div>
                  <strong>{role.label}</strong>
                  <p className="muted">Permissions</p>
                </div>
                <div className="permissions">
                  {role.permissions.map((perm) => (
                    <span key={perm}>{perm}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};

export default SuperAdminSystemSettings;
