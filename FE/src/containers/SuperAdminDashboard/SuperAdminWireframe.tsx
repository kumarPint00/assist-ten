"use client";
import React, { useEffect, useState } from 'react';
import KpiCard from '../../components/superadmin/KpiCard';
import FilterBar from '../../components/superadmin/FilterBar';
import LineChart from '../../components/superadmin/LineChart';
import AlertsPanel, { AlertItem } from '../../components/superadmin/AlertsPanel';
import SystemHealthCard from '../../components/superadmin/SystemHealthCard';
import AdminUsersTable from './AdminUsersTable';
import { Button } from '@mui/material';
import './SuperAdminWireframe.scss';
import { adminService, superadminService } from '../../API/services';

// Alerts will be loaded from superadmin incidents

const SuperAdminWireframe = ({ admins, onSwitchView }:{ admins?: any[]; onSwitchView?: (mode: 'classic' | 'wireframe') => void }) => {
  const [q, setQ] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const s = await adminService.getSystemStats();
        const inc = await superadminService.listIncidents(50);
        if (!mounted) return;
        setStats(s);
        const mapped: AlertItem[] = (inc || []).map((i: any) => ({
          id: String(i.id || i.incident_id || i.incidentId || Math.random()),
          type: i.type || i.title || 'Incident',
          severity: i.severity || 'warning',
          message: i.summary || i.message || i.description || '—',
          time: i.created_at || new Date().toISOString(),
          resolved: i.status === 'resolved' || i.resolved === true,
        }));
        setAlerts(mapped);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.detail || 'Failed to load wireframe data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);
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
        <KpiCard compact title="Active tenants" value={stats?.active_tenants ?? stats?.total_tenants ?? 0} sub="Live tenants across orgs" />
        <KpiCard compact title="Interviews today" value={stats?.interviews_today ?? stats?.interviews_today_count ?? 0} sub="Started today" />
        <KpiCard compact title="Interviews this week" value={stats?.interviews_week ?? stats?.interviews_week_count ?? 0} sub="Rolling 7 days" />
        <KpiCard compact title="Cost today (₹)" value={stats?.cost_today ?? 0} sub="LLM + infra" />
        <KpiCard compact title="Revenue today (₹)" value={stats?.revenue_today ?? 0} sub="Candidate fees & plans" />
        <KpiCard compact title="Failed interviews" value={stats?.failed_interviews ?? 0} sub="Proctoring or system errors" />
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
            <AlertsPanel items={alerts} onResolve={(id) => console.log('resolve', id)} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminWireframe;
