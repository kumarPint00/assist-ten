"use client";
import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel } from '@mui/material';
import { superadminService } from "../../API/services";
import Toast from "../../components/Toast/Toast";
import "./SuperAdminFlags.scss";

const SuperAdminFlags = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await superadminService.listFlags(200);
      setFlags(data || []);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to load flags' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const f = await superadminService.createFlag({ name, description, is_enabled: enabled });
      setFlags((prev) => [f, ...prev]);
      setOpenCreate(false); setName(''); setDescription(''); setEnabled(true);
      setToast({ type: 'success', message: 'Feature flag created' });
    } catch (err: any) { setToast({ type: 'error', message: err?.response?.data?.detail || 'Failed to create flag' }); }
  };

  const toggleFlag = async (flagId: string, isEnabled: boolean) => {
    try {
      await superadminService.updateFlag(flagId, { is_enabled: isEnabled });
      setToast({ type: 'success', message: 'Flag updated' });
      load();
    } catch (err: any) { setToast({ type: 'error', message: err?.response?.data?.detail || 'Failed to update flag' }); }
  };

  return (
    <div className="superadmin-flags">
      {toast && <Toast type={toast.type as any} message={toast.message} onClose={() => setToast(null)} />}
      <div className="header">
        <h1>Feature Flags</h1>
        <div className="actions"><Button variant="contained" onClick={() => setOpenCreate(true)}>Create flag</Button></div>
      </div>
      <div className="table">
        <div className="table-head"><span>Name</span><span>Description</span><span>Enabled</span><span>Actions</span></div>
        <div className="table-body">
          {loading && <div className="table-row empty">Loading...</div>}
          {!loading && flags.map(f => (
            <div key={f.flag_id} className="table-row">
              <span>{f.name}</span>
              <span>{f.description}</span>
              <span><FormControlLabel control={<Switch checked={f.is_enabled} onChange={(e) => toggleFlag(f.flag_id, e.target.checked)} />} label={f.is_enabled ? 'On' : 'Off'} /></span>
              <span><Button size="small" onClick={() => superadminService.deleteFlag(f.flag_id).then(() => load())}>Disable</Button></span>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Feature Flag</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Description" fullWidth value={description} onChange={(e) => setDescription(e.target.value)} />
          <FormControlLabel control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />} label="Enabled" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SuperAdminFlags;
