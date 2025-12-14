"use client";
import React, { useMemo, useState } from "react";
import "./SuperAdminTenants.scss";

const sampleTenants = [
  {
    id: 1,
    companyName: "North Star Labs",
    status: "Active",
    plan: "Enterprise",
    planDescription: "AI + Proctoring bundle with dedicated CSM",
    planHighlights: [
      "Priority onboarding and quarterly reviews",
      "AI-assisted scoring and risk alerts",
      "Unlimited interviews & proctoring",
    ],
    interviewsUsed: 1320,
    interviewLimit: 1500,
    monthlySpend: 42800,
    createdAt: "2024-08-22",
    contact: "ops@northstarlabs.com",
    lastSynced: "2m ago",
    statusReason: "High-volume partner",
    featureToggles: [
      { label: "AI auto-review", enabled: true },
      { label: "Recorded video export", enabled: true },
      { label: "Risk alerts", enabled: true },
      { label: "Sandbox access", enabled: false },
    ],
    usageHistory: [
      { label: "Dec 11", interviews: 132, cost: 3400 },
      { label: "Dec 04", interviews: 210, cost: 5600 },
      { label: "Nov 20", interviews: 190, cost: 5100 },
    ],
    activityLog: [
      { time: "2h ago", detail: "Interview limit nudged to 1,500" },
      { time: "1d ago", detail: "Billing dispute resolved" },
      { time: "3d ago", detail: "Proctoring violation remediated" },
    ],
  },
  {
    id: 2,
    companyName: "Arbor Ventures",
    status: "Pending",
    plan: "Growth",
    planDescription: "Scalable plan for 500 interviews/month",
    planHighlights: [
      "Live proctoring",
      "Advisor support during launch",
      "Usage-based overage alerts",
    ],
    interviewsUsed: 312,
    interviewLimit: 600,
    monthlySpend: 12400,
    createdAt: "2025-01-10",
    contact: "launch@arborvc.com",
    lastSynced: "16m ago",
    statusReason: "Pending payment confirmation",
    featureToggles: [
      { label: "AI auto-review", enabled: true },
      { label: "Recorded video export", enabled: false },
      { label: "Risk alerts", enabled: true },
      { label: "Sandbox access", enabled: true },
    ],
    usageHistory: [
      { label: "Dec 12", interviews: 48, cost: 2100 },
      { label: "Dec 05", interviews: 60, cost: 2500 },
      { label: "Nov 26", interviews: 30, cost: 1300 },
    ],
    activityLog: [
      { time: "4h ago", detail: "Plan upgrade to Growth queued" },
      { time: "1d ago", detail: "Compliance review started" },
      { time: "5d ago", detail: "New PO submitted" },
    ],
  },
  {
    id: 3,
    companyName: "Horizon Retail Group",
    status: "Suspended",
    plan: "Essentials",
    planDescription: "Starter plan for regional operations",
    planHighlights: [
      "20 interviews / month",
      "Email-only support",
      "Manual proctoring",
    ],
    interviewsUsed: 18,
    interviewLimit: 20,
    monthlySpend: 2800,
    createdAt: "2025-03-02",
    contact: "peopleops@horizonretail.com",
    lastSynced: "1d ago",
    statusReason: "Compliance hold after proctoring violation",
    featureToggles: [
      { label: "AI auto-review", enabled: false },
      { label: "Recorded video export", enabled: false },
      { label: "Risk alerts", enabled: true },
      { label: "Sandbox access", enabled: false },
    ],
    usageHistory: [
      { label: "Dec 09", interviews: 12, cost: 800 },
      { label: "Nov 25", interviews: 5, cost: 300 },
      { label: "Nov 10", interviews: 2, cost: 180 },
    ],
    activityLog: [
      { time: "3h ago", detail: "Suspended pending compliance review" },
      { time: "2d ago", detail: "Automated AI audit failed" },
      { time: "7d ago", detail: "Interview volume spike detected" },
    ],
  },
];

const planOptions = ["Essentials", "Growth", "Enterprise"];
const statusOptions = ["Active", "Pending", "Suspended"];

const formatCurrency = (value: number) => {
  return `₹${value.toLocaleString("en-IN")}`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SuperAdminTenants = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedTenantId, setSelectedTenantId] = useState(sampleTenants[0].id);

  const filteredTenants = useMemo(() => {
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;

    return sampleTenants.filter((tenant) => {
      if (statusFilter !== "all" && tenant.status !== statusFilter) {
        return false;
      }
      if (planFilter !== "all" && tenant.plan !== planFilter) {
        return false;
      }
      const created = new Date(tenant.createdAt);
      if (fromDate && created < fromDate) {
        return false;
      }
      if (toDate && created > toDate) {
        return false;
      }
      return true;
    });
  }, [statusFilter, planFilter, dateRange]);

  const selectedTenant =
    filteredTenants.find((tenant) => tenant.id === selectedTenantId) ?? sampleTenants[0];

  const getLimitPercent = () => {
    if (!selectedTenant) return 0;
    return Math.min(100, (selectedTenant.interviewsUsed / selectedTenant.interviewLimit) * 100);
  };

  return (
    <div className="superadmin-tenants">
      <div className="tenants-header">
        <div>
          <p className="eyebrow">Tenant operations</p>
          <h1>Companies on the platform</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="primary">Invite company</button>
          <button type="button">Request activation</button>
        </div>
      </div>

      <div className="filter-row">
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Plan
          <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)}>
            <option value="all">All plans</option>
            {planOptions.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
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
      </div>

      <div className="content-grid">
        <div className="table-panel">
          <div className="table-headline">
            <div>
              <p className="eyebrow">Tenant list</p>
              <h2>Companies overview</h2>
            </div>
            <div className="panel-meta">
              <span>{filteredTenants.length} companies</span>
              <span>Last sync {selectedTenant?.lastSynced}</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Company name</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Interviews used</th>
                  <th>Monthly spend</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className={selectedTenantId === tenant.id ? "active-row" : ""}>
                    <td>
                      <strong>{tenant.companyName}</strong>
                      <div className="muted">{tenant.contact}</div>
                    </td>
                    <td>
                      <span className={`status-chip ${tenant.status.toLowerCase()}`}>{tenant.status}</span>
                      <div className="muted">{tenant.statusReason}</div>
                    </td>
                    <td>{tenant.plan}</td>
                    <td>
                      {tenant.interviewsUsed} / {tenant.interviewLimit}
                    </td>
                    <td>{formatCurrency(tenant.monthlySpend)}</td>
                    <td>{formatDate(tenant.createdAt)}</td>
                    <td>
                      <div className="actions-row">
                        <button type="button" onClick={() => setSelectedTenantId(tenant.id)}>View</button>
                        <button type="button" className="ghost">Suspend</button>
                        <button type="button" className="plain">Upgrade</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTenants.length === 0 && (
              <div className="empty-state">No tenants match the current filters yet.</div>
            )}
          </div>
        </div>

        <div className="detail-panel">
          <div className="detail-card">
            <div className="detail-header">
              <div>
                <p className="eyebrow">Company profile</p>
                <h3>{selectedTenant.companyName}</h3>
              </div>
              <span className={`status-chip ${selectedTenant.status.toLowerCase()}`}>
                {selectedTenant.status}
              </span>
            </div>
            <p className="muted">{selectedTenant.planDescription}</p>
            <div className="profile-meta">
              <div>
                <p className="label">Plan</p>
                <strong>{selectedTenant.plan}</strong>
              </div>
              <div>
                <p className="label">Created</p>
                <strong>{formatDate(selectedTenant.createdAt)}</strong>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h4>Interview limits</h4>
            <div className="limit-bar">
              <div className="limit-fill" style={{ width: `${getLimitPercent()}%` }} />
            </div>
            <div className="limit-meta">
              <span>
                {selectedTenant.interviewsUsed} used of {selectedTenant.interviewLimit}
              </span>
              <span>{selectedTenant.interviewLimit - selectedTenant.interviewsUsed} remaining</span>
            </div>
          </div>

          <div className="detail-card">
            <h4>Feature toggles</h4>
            <div className="toggle-grid">
              {selectedTenant.featureToggles.map((toggle) => (
                <div key={toggle.label} className={`toggle-chip ${toggle.enabled ? "on" : "off"}`}>
                  <span>{toggle.label}</span>
                  <span className="pill">{toggle.enabled ? "ON" : "OFF"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-card">
            <h4>Usage history</h4>
            <div className="usage-history">
              {selectedTenant.usageHistory.map((snapshot) => (
                <div key={snapshot.label} className="usage-row">
                  <div>
                    <strong>{snapshot.label}</strong>
                    <div className="muted">Interviews {snapshot.interviews}</div>
                  </div>
                  <div>{formatCurrency(snapshot.cost)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-card">
            <h4>Activity log</h4>
            <div className="activity-log">
              {selectedTenant.activityLog.map((entry) => (
                <div key={entry.time} className="activity-row">
                  <span className="muted">{entry.time}</span>
                  <p>{entry.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminTenants;