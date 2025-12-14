"use client";
import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { superadminService } from "../../API/services";
import Toast from "../../components/Toast/Toast";
import "./SuperAdminIncidents.scss";

const SuperAdminIncidents = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await superadminService.listIncidents(200);
      setIncidents(data || []);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to load incidents' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const payload = { title, description, incident_type: 'outage', severity: 'medium' };
      const inc = await superadminService.createIncident(payload);
      setIncidents((prev) => [inc, ...prev]);
      setOpenCreate(false);
      setTitle(''); setDescription('');
      setToast({ type: 'success', message: 'Incident created' });
    } catch (err: any) {
      console.error(err);
      setToast({ type: 'error', message: err?.response?.data?.detail || 'Failed to create incident' });
    }
  };

  return (
    <div className="superadmin-incidents">
      {toast && <Toast type={toast.type as any} message={toast.message} onClose={() => setToast(null)} />}
      <div className="header">
        <h1>Incidents</h1>
        <div className="actions">
          <Button variant="contained" onClick={() => setOpenCreate(true)}>Create incident</Button>
        </div>
      </div>
      <div className="table">
        <div className="table-head"><span>Title</span><span>Type</span><span>Severity</span><span>Detected</span><span>Actions</span></div>
        <div className="table-body">
          {loading && <div className="table-row empty">Loading...</div>}
          {!loading && incidents.map((i) => (
            <div key={i.incident_id} className="table-row">
              <span>{i.title}</span>
              <span>{i.incident_type}</span>
              <span>{i.severity}</span>
              <span>{new Date(i.detected_at).toLocaleString()}</span>
              <span><Button size="small" onClick={() => {}}>View</Button></span>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Incident</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Description" fullWidth multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SuperAdminIncidents;
