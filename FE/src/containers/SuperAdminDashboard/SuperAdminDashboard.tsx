"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Avatar, Tooltip } from '@mui/material';
import { FiTrendingUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { userService } from '../../API/services';
import { adminService } from "../../API/services";
import Toast from "../../components/Toast/Toast";
import SuperAdminWireframe from './SuperAdminWireframe';
import AdminUsersTable from './AdminUsersTable';
import KpiCard from '../../components/superadmin/KpiCard';
import "./SuperAdminDashboard.scss";

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'classic' | 'wireframe'>('classic');

  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        // Ensure current user is superadmin
        const currentUser = await userService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'superadmin') {
          // redirect to admin dashboard or show not authorized
          router.replace('/admin');
          return;
        }
        setLoading(true);
        const s = await adminService.getSystemStats();
        setStats(s);
        const userList = await adminService.listAdmins();
        setAdmins(userList);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.detail || "Failed to load system stats and admins");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreateAdmin = async (inviteEmail?: string, inviteName?: string) => {
    if (!email) return setToast({ type: "error", message: "Email required" });
    setCreating(true);
    try {
      const e = inviteEmail || email;
      const n = inviteName || fullName;
      await adminService.createAdminUser(e, n, "admin");
      setToast({ type: "success", message: "Admin user created" });
      // Refresh list
      const userList = await adminService.listAdmins();
      setAdmins(userList);
      setEmail("");
      setFullName("");
      setInviteOpen(false);
      addActivity(`Invited admin ${e}`);
    } catch (err: any) {
      console.error(err);
      setToast({ type: "error", message: err?.response?.data?.detail || "Failed to create admin" });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRole = async (userId: number, role: string) => {
    try {
      await adminService.updateUserRole(userId, role);
      setToast({ type: "success", message: "User role updated" });
      const userList = await adminService.listAdmins();
      setAdmins(userList);
    } catch (err: any) {
      console.error(err);
      setToast({ type: "error", message: err?.response?.data?.detail || "Failed to update role" });
    }
  };

  const handleDelete = async (userId: number) => {
    // For now, perform a local remove; backend delete endpoint not implemented in adminService
    setAdmins(prev => prev.filter(u => u.id !== userId));
    addActivity(`Deleted admin ${userId}`);
  };

  // Activity log helper
  const addActivity = (msg: string) => {
    setActivityLog(prev => [{ message: msg, time: new Date().toISOString() }, ...prev].slice(0, 20));
  };

  const exportAdminsCSV = (rows: any[]) => {
    if (!rows || rows.length === 0) return;
    const headers = ['email','full_name','role','created_at'];
    const csv = [headers.join(',')].concat(rows.map(r => `${r.email},"${r.full_name||''}",${r.role},${r.created_at||''}`)).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin_users.csv';
    a.click();
    URL.revokeObjectURL(url);
    addActivity('Exported admin users CSV');
  };

  const filteredAdmins = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return admins.filter(a => !q || (a.email || '').toLowerCase().includes(q) || (a.full_name || '').toLowerCase().includes(q));
  }, [admins, searchQuery]);

  if (loading) {
    return (
      <div className="superadmin-dashboard">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="superadmin-dashboard">
      {toast && (
        <Toast type={toast.type as any} message={toast.message} onClose={() => setToast(null)} />
      )}
      {error && <div className="error">{error}</div>}

      {viewMode === 'wireframe' ? (
        <SuperAdminWireframe admins={admins} onSwitchView={(mode) => setViewMode(mode)} />
      ) : (
        <div className="sa-content">
          <section className="panel overview-panel">
            <div className="panel-header">
              <div>
                <h3>Overview</h3>
                <p>System KPIs and operational insights</p>
              </div>
              <div className="panel-actions">
                <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} startIcon={<FiTrendingUp />} onClick={() => setViewMode('wireframe')}>
                  Wireframe view
                </Button>
              </div>
            </div>
            <div className="sa-stats">
              <KpiCard title="Total Assessments" value={stats?.total_assessments ?? 0} />
              <KpiCard title="Total Users" value={stats?.total_users ?? 0} />
              <KpiCard title="Total Candidates" value={stats?.total_test_sessions ?? stats?.total_candidates ?? 0} />
            </div>
          </section>
          <section className="panel admins-panel">
            <div className="panel-header">
              <div>
                <h3>Admin Users</h3>
                <p>Manage roles, invites, and exports</p>
              </div>
              <div className="panel-actions">
                <Button size="small" variant="outlined" onClick={() => exportAdminsCSV(filteredAdmins)}>Export</Button>
                <Button size="small" variant="contained" onClick={() => setInviteOpen(true)}>Invite</Button>
              </div>
            </div>
            <AdminUsersTable users={admins} onRoleUpdate={handleUpdateRole} onDelete={handleDelete} />
          </section>
        </div>
      )}

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Invite Admin</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Full Name"
            fullWidth
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleCreateAdmin()} disabled={creating}>Send invite</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
