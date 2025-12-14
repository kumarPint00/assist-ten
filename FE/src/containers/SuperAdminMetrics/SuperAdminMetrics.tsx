"use client";
import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { superadminService } from "../../API/services";
import Toast from "../../components/Toast/Toast";
import "./SuperAdminMetrics.scss";

const SuperAdminMetrics = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState<string | number>(0);
  const [service, setService] = useState("");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await superadminService.listMetrics(200);
      setMetrics(data || []);
    } catch (err) { setToast({ type: 'error', message: 'Failed to load metrics' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const payload = { metric_name: name, metric_type: 'gauge', value: Number(value), unit: '', service };
      const m = await superadminService.recordMetric(payload);
      setMetrics((prev) => [m, ...prev]); setOpenCreate(false); setName(''); setValue(0); setService('');
      setToast({ type: 'success', message: 'Metric recorded' });
    } catch (err: any) { setToast({ type: 'error', message: err?.response?.data?.detail || 'Failed to record metric' }); }
  };

  return (
    <div className="superadmin-metrics">
      {toast && <Toast type={toast.type as any} message={toast.message} onClose={() => setToast(null)} />}
      <div className="header">
        <h1>System Metrics</h1>
        <div className="actions"><Button variant="contained" onClick={() => setOpenCreate(true)}>Record metric</Button></div>
      </div>
      <div className="table">
        <div className="table-head"><span>Name</span><span>Value</span><span>Service</span><span>Measured</span></div>
        <div className="table-body">
          {loading && <div className="table-row empty">Loading...</div>}
          {!loading && metrics.map(m => (
            <div className="table-row" key={m.metric_id}><span>{m.metric_name}</span><span>{m.value}</span><span>{m.service}</span><span>{new Date(m.measured_at).toLocaleString()}</span></div>
          ))}
        </div>
      </div>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Record Metric</DialogTitle>
        <DialogContent>
          <TextField label="Metric name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Value" fullWidth value={String(value)} onChange={(e) => setValue(e.target.value)} />
          <TextField label="Service" fullWidth value={service} onChange={(e) => setService(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Record</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SuperAdminMetrics;
