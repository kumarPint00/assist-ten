"use client";
import React from "react";
import "./AdminBilling.scss";

const INVOICE_HISTORY = [
  { id: "INV-2012", date: "Nov 28, 2025", amount: "$3,900", status: "Paid" },
  { id: "INV-2008", date: "Oct 30, 2025", amount: "$3,900", status: "Paid" },
  { id: "INV-2004", date: "Sep 28, 2025", amount: "$3,900", status: "Paid" },
];

const USAGE_TREND = [
  { label: "Jul", interviews: 40 },
  { label: "Aug", interviews: 46 },
  { label: "Sep", interviews: 52 },
  { label: "Oct", interviews: 48 },
  { label: "Nov", interviews: 61 },
  { label: "Dec", interviews: 18 },
];

const AdminBilling = () => {
  return (
    <div className="admin-billing">
      <header className="billing-header">
        <div>
          <p className="eyebrow">Financial overview</p>
          <h1>Billing & usage</h1>
          <p className="subhead">Transparency only—no AI pricing jargon, just the metrics your finance team needs.</p>
        </div>
        <div className="plan-card">
          <p className="tiny">Current plan</p>
          <strong>Growth</strong>
          <p className="plan-detail">6 seats • 120 interviews / month</p>
          <button className="btn btn-outline" type="button">
            Upgrade plan
          </button>
        </div>
      </header>

      <div className="billing-grid">
        <section className="card summary-card">
          <h2>Usage snapshot</h2>
          <div className="summary-row">
            <article>
              <p className="label">Interviews used</p>
              <strong>58</strong>
            </article>
            <article>
              <p className="label">Remaining credits</p>
              <strong>62</strong>
            </article>
            <article>
              <p className="label">Next renewal</p>
              <strong>Jan 01, 2026</strong>
            </article>
          </div>
          <div className="action-group">
            <button className="btn btn-primary" type="button">
              Buy credits
            </button>
            <button className="btn btn-link" type="button">
              Download invoices
            </button>
          </div>
        </section>

        <section className="card trend-card">
          <h2>Usage trend</h2>
          <div className="trend-chart">
            {USAGE_TREND.map((point) => (
              <div key={point.label} className="trend-point">
                <p className="label">{point.label}</p>
                <div className="bar" style={{ height: `${point.interviews / 2}px` }} />
                <strong>{point.interviews}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card invoice-card">
        <div className="panel-heading">
          <h2>Invoice history</h2>
          <p className="tiny">Download to share with finance.</p>
        </div>
        <div className="invoice-table">
          <div className="table-head">
            <span>Invoice</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
            <span />
          </div>
          {INVOICE_HISTORY.map((invoice) => (
            <div key={invoice.id} className="invoice-row">
              <span>{invoice.id}</span>
              <span>{invoice.date}</span>
              <span>{invoice.amount}</span>
              <span className="status-pill">{invoice.status}</span>
              <button className="btn btn-link" type="button">
                Download
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminBilling;
