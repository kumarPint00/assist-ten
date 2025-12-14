"use client";
import React, { useEffect, useState } from 'react';
import { adminService } from '../../../../src/API/services';
import Toast from '../../../../src/components/Toast/Toast';
import './admins.scss';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminService.listAdmins();
        setAdmins(res);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load admin users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChangeRole = async (id: number, role: string) => {
    try {
      await adminService.updateUserRole(id, role);
      setToast({ type: 'success', message: 'Updated role' });
      const res = await adminService.listAdmins();
      setAdmins(res);
    } catch (e: any) {
      setToast({ type: 'error', message: e?.response?.data?.detail || 'Failed' });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {toast && <Toast type={toast.type as any} message={toast.message} onClose={() => setToast(null)} />}
      <h3>Admin Users</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {loading && <div>Loading...</div>}
      {!loading && admins.map((a: any) => (
        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #eee' }}>
          <div>
            <div>{a.email}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{a.full_name}</div>
          </div>
          <div>
            {a.role !== 'superadmin' ? (
              <select defaultValue={a.role} onChange={(e) => handleChangeRole(a.id, e.target.value)}>
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
            ) : (
              <span>Superadmin</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
