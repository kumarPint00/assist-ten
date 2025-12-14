"use client";
import React, { useState } from 'react';
import KpiCard from '../../components/superadmin/KpiCard';
import FilterBar from '../../components/superadmin/FilterBar';
import LineChart from '../../components/superadmin/LineChart';
import AlertsPanel, { AlertItem } from '../../components/superadmin/AlertsPanel';
import SystemHealthCard from '../../components/superadmin/SystemHealthCard';
import AdminUsersTable from './AdminUsersTable';
import { Button } from '@mui/material';
import './SuperAdminWireframe.scss';

const sampleAlerts: AlertItem[] = [
  { id: 'a1', type: 'AI Failure', severity: 'critical', message: 'LLM timeout on skill extraction', time: new Date().toISOString(), resolved: false },
  { id: 'a2', type: 'Proctor Violation', severity: 'warning', message: 'Multiple camera disconnects on candidate-183', time: new Date().toISOString(), resolved: false },
  { id: 'a3', type: 'Billing', severity: 'info', message: 'Billing anomaly: negative balance on tenant-12', time: new Date().toISOString(), resolved: false },
];

const SuperAdminWireframe = ({ admins, onSwitchView }:{ admins?: any[]; onSwitchView?: (mode: 'classic' | 'wireframe') => void }) => {
  const [q, setQ] = useState('');
  return (
    <div className="superadmin-wireframe">
      <div className="sa-toolbar">
        <FilterBar placeholder="Search tenants, admins..." onSearch={(s) => setQ(s)} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button size='small'>Last 30 days</Button>
          <Button size='small' variant='outlined'>Export</Button>
          <Button size='small' variant='text' onClick={() => onSwitchView?.('classic')} sx={{ textTransform: 'none' }}>Classic view</Button>
        </div>
      </div>
      {/* KPI Row */}
      <div className="kpi-grid">
        <KpiCard compact title="Active tenants" value={152} sub="Live tenants across orgs" />
        <KpiCard compact title="Interviews today" value={420} sub="Started today" />
        <KpiCard compact title="Interviews this week" value={2320} sub="Rolling 7 days" />
        <KpiCard compact title="Cost today (₹)" value={6540} sub="LLM + infra" />
        <KpiCard compact title="Revenue today (₹)" value={13200} sub="Candidate fees & plans" />
        <KpiCard compact title="Failed interviews" value={12} sub="Proctoring or system errors" />
      </div>

      {/* Main area */}
      <div className="main-grid">
        <div className="grid-left">
          <div className="chart-stack">
            <div className="chart-card">
              <LineChart title="Interviews vs Cost (30 days)" />
            </div>
            <div className="chart-card">
              <LineChart title="Interviews vs Cost (30 days)" />
            </div>
          </div>

          <div className="secondary-row">
            <div className="small-card">
              <KpiCard title="Gross margin" value="52%" sub="Revenue - Cost" />
            </div>
            <div className="small-card">
              <KpiCard title="Interviews this month" value={12640} sub="Calendar month" />
            </div>
            <div className="small-card">
              <KpiCard title="Active interviews" value={42} sub="Currently running" />
            </div>
          </div>

          <div className="admins-panel">
            <header>
              <h3>Top Admins</h3>
              <p>Ensure the right roles are enabled</p>
            </header>
            <AdminUsersTable users={admins || []} onRoleUpdate={() => {}} onDelete={() => {}} q={q} onSearch={setQ} />
          </div>
        </div>

        <div className="grid-right">
          <div className="health-card">
            <SystemHealthCard name="Queue depth" value={12} details="Redis queue: 12 tasks waiting" onAction={() => {}} />
          </div>
          <div className="health-card">
            <SystemHealthCard name="LLM latency" value="230 ms" details="Avg / 5 min" onAction={() => {}} />
          </div>
          <div className="alerts-card">
            <AlertsPanel items={sampleAlerts} onResolve={(id) => console.log('resolve', id)} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminWireframe;
