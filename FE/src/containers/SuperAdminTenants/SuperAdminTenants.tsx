"use client";
import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { superadminService } from "../../API/services";
import Toast from "../../components/Toast/Toast";
import "./SuperAdminTenants.scss";

const SuperAdminTenants = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await superadminService.listTenants(200);
      setTenants(data || []);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to load tenants' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      const payload = { name, domain };
      const t = await superadminService.createTenant(payload);
      setTenants((prev) => [t, ...prev]);
      setOpenCreate(false);
      setName(""); setDomain("");
      setToast({ type: 'success', message: 'Tenant created' });
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.response?.data?.detail || 'Failed to create tenant' });
    }
  };

  const handleDeactivate = async (tenantId: string) => {
    try {
      const r = await superadminService.deleteTenant(tenantId);
      setToast({ type: 'success', message: r?.message || 'Tenant deactivated' });
      load();
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.response?.data?.detail || 'Failed to deactivate tenant' });
    }
  };

  return (
    <div className="superadmin-tenants">
      {toast && <Toast type={toast.type as any} message={toast.message} onClose={() => setToast(null)} />}
      <div className="header">
        <h1>Tenants</h1>
        <div className="actions">
          <Button variant="contained" onClick={() => setOpenCreate(true)}>Create tenant</Button>
        </div>
      </div>
      <div className="table">
        <div className="table-head">
          <span>Name</span>
          <span>Domain</span>
          <span>Active</span>
          <span>Created</span>
          <span>Actions</span>
        </div>
        <div className="table-body">
          {loading && <div className="table-row empty">Loading...</div>}
          {!loading && tenants.map((t) => (
            <div key={t.tenant_id} className="table-row">
              <span>{t.name}</span>
              <span>{t.domain}</span>
              <span>{t.is_active ? 'Yes' : 'No'}</span>
              <span>{new Date(t.created_at).toLocaleString()}</span>
              <span>
                <Button size="small" onClick={() => handleDeactivate(t.tenant_id)}>-Deactivate</Button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Tenant</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Domain" fullWidth value={domain} onChange={(e) => setDomain(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SuperAdminTenants;
