"use client";
import React from "react";
import "./SuperAdminBilling.scss";

const tenantMetrics = [
  { id: "tenant-01", name: "Lumina AI", revenue: 182_000, cost: 94_000 },
  { id: "tenant-02", name: "Pulse Grid", revenue: 123_500, cost: 77_200 },
  { id: "tenant-03", name: "Cortex Atlas", revenue: 98_400, cost: 45_600 },
];

const today = new Date();
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const usageSummary = [
  { tenant: "Lumina AI", interviews: 42, audioMinutes: 3120, storageGb: 180, lastSynced: "2025-12-12" },
  { tenant: "Pulse Grid", interviews: 33, audioMinutes: 2450, storageGb: 140, lastSynced: "2025-12-12" },
  { tenant: "Cortex Atlas", interviews: 28, audioMinutes: 1910, storageGb: 125, lastSynced: "2025-12-12" },
];

const invoiceHistory = [
  { invoice: "INV-2031", tenant: "Lumina AI", amount: 56_200, date: "2025-11-25", status: "Paid" },
  { invoice: "INV-2032", tenant: "Pulse Grid", amount: 41_300, date: "2025-11-28", status: "Pending" },
  { invoice: "INV-2033", tenant: "Cortex Atlas", amount: 32_100, date: "2025-11-30", status: "Paid" },
];

const manualAdjustments = [
  { tenant: "Lumina AI", change: "+$2,400 credit", reason: "Early renewal", date: "2025-12-05" },
  { tenant: "Pulse Grid", change: "-$1,100 charge", reason: "Storage overage", date: "2025-12-07" },
  { tenant: "Cortex Atlas", change: "+$550 credit", reason: "Referral", date: "2025-12-02" },
];

const SuperAdminBilling = () => {
  const totalMetrics = tenantMetrics.reduce(
    (acc, current) => {
      acc.revenue += current.revenue;
      acc.cost += current.cost;
      return acc;
    },
    { revenue: 0, cost: 0 }
  );

  const marginTotal = totalMetrics.revenue - totalMetrics.cost;

  return (
    <div className="superadmin-billing">
      <header className="billing-header">
        <div>
          <p className="eyebrow">Billing & Usage</p>
          <h1>Track revenue, cost, and margin per tenant</h1>
          <p className="muted">Updated {today.toLocaleDateString()} · synced across payments, storage, and usage feeds.</p>
        </div>
        <div className="header-actions">
          <button className="primary">Change plan</button>
          <button>Apply credits</button>
          <button className="ghost">Download invoices</button>
        </div>
      </header>

      <section className="overview">
        <article>
          <div className="label">Total revenue</div>
          <h2>{formatCurrency(totalMetrics.revenue)}</h2>
          <p className="muted">Across {tenantMetrics.length} tenants</p>
        </article>
        <article>
          <div className="label">Total cost</div>
          <h2>{formatCurrency(totalMetrics.cost)}</h2>
          <p className="muted">Includes compute, proctoring, and storage</p>
        </article>
        <article>
          <div className="label">Margin</div>
          <h2>{formatCurrency(marginTotal)}</h2>
          <p className="muted">Revenue − cost</p>
        </article>
      </section>

      <section className="by-tenant">
        <header>
          <div>
            <h3>Revenue/Cost by tenant</h3>
            <p className="muted">Select a tenant to see detailed usage</p>
          </div>
          <span className="muted">Syncs every 2h</span>
        </header>
        <div className="tenant-matrix">
          {tenantMetrics.map((tenant) => (
            <article key={tenant.id}>
              <div className="tenant-title">
                <strong>{tenant.name}</strong>
                <span className="muted">Margin {formatCurrency(tenant.revenue - tenant.cost)}</span>
              </div>
              <div className="metric-row">
                <span>Revenue</span>
                <strong>{formatCurrency(tenant.revenue)}</strong>
              </div>
              <div className="metric-row">
                <span>Cost</span>
                <strong>{formatCurrency(tenant.cost)}</strong>
              </div>
              <div className="progress">
                <div
                  className="progress-fill"
                  style={{ width: `${((tenant.revenue - tenant.cost) / tenant.revenue) * 100}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="details-grid">
        <article>
          <div className="section-heading">
            <h3>Interview usage</h3>
            <p className="muted">Sessions and audio minutes</p>
          </div>
          <div className="table">
            <div className="row head">
              <span>Tenant</span>
              <span>Interviews</span>
              <span>Audio minutes</span>
              <span>Storage (GB)</span>
            </div>
            {usageSummary.map((row) => (
              <div className="row" key={row.tenant}>
                <span>{row.tenant}</span>
                <span>{row.interviews}</span>
                <span>{row.audioMinutes}</span>
                <span>{row.storageGb}</span>
              </div>
            ))}
          </div>
        </article>

        <article>
          <div className="section-heading">
            <h3>Invoice history</h3>
            <p className="muted">Recent billing events</p>
          </div>
          <div className="table">
            <div className="row head">
              <span>Invoice</span>
              <span>Tenant</span>
              <span>Date</span>
              <span>Status</span>
              <span>Amount</span>
            </div>
            {invoiceHistory.map((row) => (
              <div className="row" key={row.invoice}>
                <span>{row.invoice}</span>
                <span>{row.tenant}</span>
                <span>{row.date}</span>
                <span>{row.status}</span>
                <strong>{formatCurrency(row.amount)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article>
          <div className="section-heading">
            <h3>Manual adjustments</h3>
            <p className="muted">Clawbacks or credits we applied</p>
          </div>
          <ul className="adjustments">
            {manualAdjustments.map((adjustment) => (
              <li key={`${adjustment.tenant}-${adjustment.date}`}>
                <div>
                  <strong>{adjustment.tenant}</strong>
                  <p className="muted">{adjustment.date}</p>
                </div>
                <div className="adjustment-detail">
                  <span>{adjustment.change}</span>
                  <small>{adjustment.reason}</small>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};

export default SuperAdminBilling;
