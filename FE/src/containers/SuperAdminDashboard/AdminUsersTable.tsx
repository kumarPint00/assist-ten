"use client";
import React, { useMemo, useState } from 'react';
import DataTable, { Column } from '../../components/superadmin/DataTable';
import BulkActionToolbar from '../../components/superadmin/BulkActionToolbar';
import { Button } from '@mui/material';

export default function AdminUsersTable({ users, onRoleUpdate, onDelete, q='', onSearch }:{ users:any[]; onRoleUpdate:(id:number,role:string)=>void; onDelete:(id:number)=>void; q?:string; onSearch?: (s:string)=>void }){
  const [selected, setSelected] = useState<(string|number)[]>([]);
  const [sortKey, setSortKey] = useState<string | undefined>('email');
  const [sortDir, setSortDir] = useState<'asc'|'desc'|'none'>('asc');

  const columns: Column<any>[] = useMemo(() => ([
    { key: 'email', title: 'Email', sortable: true },
    { key: 'full_name', title: 'Name', sortable: true },
    { key: 'role', title: 'Role' },
    { key: 'created_at', title: 'Created' },
    { key: 'actions', title: 'Actions', render: (u) => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
        <button onClick={() => onRoleUpdate(u.id, u.role === 'admin' ? 'user' : 'admin')} style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 13 }}>{u.role === 'admin' ? 'Revoke' : 'Make admin'}</button>
        <button onClick={() => onDelete(u.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>Delete</button>
      </div>
    )}
  ]), []);

  // Use the passed query prop; keep local state minimal
  const onSelect = (id: number | string, checked: boolean) => {
    setSelected(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  }

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? users.map(u => u.id) : []);
  }

  const handleAction = (action: string) => {
    console.log('Bulk action:', action, selected);
  }

  const query = (q || '').toLowerCase();
  const filtered = users.filter(u => !query || (u.email || '').toLowerCase().includes(query) || (u.full_name || '').toLowerCase().includes(query));

  return (
    <div>
      {/* toolbar is centralized in the parent; keep table compact and dense */}
      {selected.length > 0 && <BulkActionToolbar count={selected.length} onAction={handleAction} />}
      <DataTable
        columns={columns}
        rows={filtered}
        compact
        selectable
        selected={selected}
        onSelect={onSelect}
        onSelectAll={handleSelectAll}
        sortKey={sortKey}
        sortDir={sortDir === 'none' ? null : sortDir}
        onSort={(k) => { if (k === sortKey) setSortDir(s => s === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('asc'); } }}
      />
    </div>
  );
}
