"use client";
import React, { useState } from "react";
import "./SuperAdminAIControl.scss";

const tasks = [
  { key: "jd", label: "JD parsing", model: "gpt-5-llmium", version: "v2.1", status: "Live" },
  { key: "cv", label: "CV parsing", model: "groq-qa-1", version: "v1.4", status: "Live" },
  { key: "questions", label: "Question generation", model: "gpt-5.1-condense", version: "v3.0", status: "Staging" },
  { key: "ai", label: "AI interviewer", model: "gpt-5.1-ai", version: "v1.2", status: "Live" },
  { key: "scoring", label: "Scoring", model: "groq-score-2", version: "v2.4", status: "Live" },
];

const promptVersions = [
  { task: "JD parsing", version: "v2.1", deployedAt: "Dec 08" },
  { task: "AI interviewer", version: "v1.2", deployedAt: "Dec 04" },
  { task: "Question generation", version: "v3.0", deployedAt: "Dec 05 (staging)" },
];

const rolloutOptions = [
  { label: "Global", description: "Applies to every tenant", flag: "global-ai-rollout" },
  { label: "Tenant-specific", description: "Overrides per tenant", flag: "tenant-ai-rollout" },
];

const usageStats = [
  { label: "LLM calls / day", value: "8.1K", delta: "+12%" },
  { label: "Average latency", value: "320ms", delta: "-8%" },
  { label: "Cost / 24h", value: "₹42K", delta: "+4%" },
];

const costImpact = [
  { name: "AI interviewer", impact: "+₹18K" },
  { name: "Question generation", impact: "+₹12K" },
  { name: "JD parsing", impact: "+₹6K" },
];

const SuperAdminAIControl = () => {
  const [selectedTask, setSelectedTask] = useState(tasks[0].key);
  const selected = tasks.find((task) => task.key === selectedTask) ?? tasks[0];

  return (
    <div className="superadmin-ai">
      <div className="ai-header">
        <div>
          <p className="eyebrow">AI & Interview Intelligence</p>
          <h1>Control LLM behavior</h1>
        </div>
        <div className="header-actions">
          <button className="primary">Update model</button>
          <button>Rollback prompt</button>
          <button className="ghost">Toggle flags</button>
        </div>
      </div>

      <div className="panel-grid">
        <section className="panel tasks-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">LLM selection</p>
              <h2>Task-specific models</h2>
            </div>
            <p className="muted">Pick a task to adjust the version.</p>
          </div>
          <div className="task-list">
            {tasks.map((task) => (
              <button
                key={task.key}
                className={`task-row ${selectedTask === task.key ? "active" : ""}`}
                onClick={() => setSelectedTask(task.key)}
              >
                <div>
                  <strong>{task.label}</strong>
                  <div className="muted">{task.model}</div>
                </div>
                <div className="task-meta">
                  <span>{task.version}</span>
                  <span className={`status-chip ${task.status.toLowerCase()}`}>{task.status}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel prompt-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Prompt versioning</p>
              <h2>{selected.label} prompt history</h2>
            </div>
            <button className="primary">Create version</button>
          </div>
          <div className="prompt-list">
            {promptVersions.map((entry) => (
              <div key={entry.task} className="prompt-row">
                <div>
                  <strong>{entry.task}</strong>
                  <div className="muted">Deployed {entry.deployedAt}</div>
                </div>
                <span className="version-pill">{entry.version}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="panel-grid">
        <section className="panel rollout-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Rollout controls</p>
              <h2>Enable / disable</h2>
            </div>
          </div>
          <div className="rollout-list">
            {rolloutOptions.map((option) => (
              <div key={option.flag} className="rollout-row">
                <div>
                  <strong>{option.label}</strong>
                  <div className="muted">{option.description}</div>
                </div>
                <button className="primary">Manage</button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stats-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Model usage stats</p>
              <h2>Telemetry overview</h2>
            </div>
          </div>
          <div className="stat-grid">
            {usageStats.map((stat) => (
              <div key={stat.label} className="stat-tile">
                <p className="muted">{stat.label}</p>
                <strong>{stat.value}</strong>
                <span>{stat.delta}</span>
              </div>
            ))}
          </div>
          <div className="cost-preview">
            <p className="eyebrow">Cost impact preview</p>
            <div className="cost-list">
              {costImpact.map((row) => (
                <div key={row.name} className="cost-row">
                  <span>{row.name}</span>
                  <strong>{row.impact}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminAIControl;
