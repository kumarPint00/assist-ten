"use client";
import React, { useMemo, useState } from "react";
import "./SuperAdminAuditLogs.scss";

const auditEvents = [
  {
    id: "evt-101",
    actor: "Anya Patel",
    action: "Updated interview template",
    entity: "Template · Agentic AI",
    timestamp: "2025-12-12T14:22:33Z",
    ip: "192.168.10.2",
    tenant: "Lumina AI",
    type: "Template",
  },
  {
    id: "evt-102",
    actor: "Suresh Menon",
    action: "Blocked tenant",
    entity: "Tenant · Pulse Grid",
    timestamp: "2025-12-11T12:05:10Z",
    ip: "192.168.15.118",
    tenant: "Pulse Grid",
    type: "Tenant",
  },
  {
    id: "evt-103",
    actor: "Internal\u00a0System",
    action: "Auto-saved rubric changes",
    entity: "Rubric · Cortex Atlas",
    timestamp: "2025-12-10T15:42:50Z",
    ip: "10.23.0.5",
    tenant: "Cortex Atlas",
    type: "Rubric",
  },
  {
    id: "evt-104",
    actor: "Devon Reyes",
    action: "Requested export",
    entity: "Report · Financial",
    timestamp: "2025-12-09T08:18:22Z",
    ip: "172.16.12.9",
    tenant: "Pulse Grid",
    type: "Report",
  },
  {
    id: "evt-105",
    actor: "Admin API",
    action: "Changed billing plan",
    entity: "Tenant · Lumina AI",
    timestamp: "2025-12-08T19:02:07Z",
    ip: "13.64.98.12",
    tenant: "Lumina AI",
    type: "Billing",
  },
];

const SuperAdminAuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "2025-12-08", end: "2025-12-13" });

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return auditEvents.filter((event) => {
      if (selectedUser !== "all" && event.actor !== selectedUser) {
        return false;
      }
      if (selectedAction !== "all" && event.type !== selectedAction) {
        return false;
      }
      const eventDate = new Date(event.timestamp);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      if (eventDate < start || eventDate > end) {
        return false;
      }
      if (normalizedSearch.length === 0) {
        return true;
      }
      return (
        event.actor.toLowerCase().includes(normalizedSearch) ||
        event.action.toLowerCase().includes(normalizedSearch) ||
        event.entity.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchTerm, selectedUser, selectedAction, dateRange]);

  return (
    <div className="superadmin-auditlogs">
      <div className="audit-header">
        <div>
          <p className="eyebrow">Audit Logs</p>
          <h1>Immutable traceability for every critical action</h1>
          <p className="muted">Filters stay sticky while you page through historical data and exports.</p>
        </div>
        <div className="header-actions">
          <button className="ghost">Export log</button>
          <button className="primary">Start live monitoring</button>
        </div>
      </div>

      <section className="filters">
        <div className="filter-row">
          <label>
            Date range
            <div className="range-inputs">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              />
              <span>—</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </label>
          <label>
            User
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="all">All actors</option>
              {Array.from(new Set(auditEvents.map((event) => event.actor))).map((actor) => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
          </label>
          <label>
            Action type
            <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
              <option value="all">All actions</option>
              {Array.from(new Set(auditEvents.map((event) => event.type))).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="search">
            Search
            <input
              type="search"
              placeholder="actor, action, entity"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="table">
        <div className="table-head">
          <span>Actor</span>
          <span>Action</span>
          <span>Entity</span>
          <span>Timestamp</span>
          <span>IP address</span>
        </div>
        <div className="table-body">
          {filteredEvents.map((event) => (
            <div key={event.id} className="table-row">
              <span>{event.actor}</span>
              <span>{event.action}</span>
              <span>{event.entity}</span>
              <span>{new Date(event.timestamp).toLocaleString()}</span>
              <span>{event.ip}</span>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="table-row empty">No audit events match the current filters.</div>
          )}
        </div>
        <div className="pagination">
          <div>Showing {filteredEvents.length} of {auditEvents.length}</div>
          <div className="page-controls">
            <button disabled>Prev</button>
            <button className="primary">Next</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SuperAdminAuditLogs;
