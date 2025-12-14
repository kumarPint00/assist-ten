"use client";
import React from 'react';
import NavLink from '../../../components/NavLink/NavLink';
import "./SuperAdminSidebar.scss";

const SuperAdminSidebar = () => {
  return (
    <div className="superadmin-sidebar">
      <div className="sidebar-logo">Super Admin</div>
      <nav className="superadmin-nav">
        <NavLink to="/admin/super" className="admin-link">Overview</NavLink>
        <NavLink to="/admin/super/admins" className="admin-link">Admins</NavLink>
        <NavLink to="/admin/super/interviews" className="admin-link">Interviews</NavLink>
        <NavLink to="/admin/super/ai" className="admin-link">AI & LLM</NavLink>
        <NavLink to="/admin/super/questions" className="admin-link">Questions & Rubrics</NavLink>
        <NavLink to="/admin/super/proctoring" className="admin-link">Proctoring</NavLink>
        <NavLink to="/admin/super/billing" className="admin-link">Billing</NavLink>
        <NavLink to="/admin/super/incidents" className="admin-link">Incidents</NavLink>
        <NavLink to="/admin/super/audit-logs" className="admin-link">Audit Logs</NavLink>
        <NavLink to="/admin/super/flags" className="admin-link">Feature Flags</NavLink>
        <NavLink to="/admin/super/metrics" className="admin-link">Metrics</NavLink>
        <NavLink to="/admin/super/system-settings" className="admin-link">System Settings</NavLink>
        <NavLink to="/admin/super/tenants" className="admin-link">Tenants</NavLink>
      </nav>
    </div>
  )
}

export default SuperAdminSidebar;
