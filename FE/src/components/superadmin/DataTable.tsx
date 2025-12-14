"use client";
import React from 'react';
import './DataTable.scss';
import { Table, TableHead, TableRow, TableCell, TableBody, Checkbox, IconButton } from '@mui/material';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export type Column<T> = {
  key: string;
  title: string;
  width?: string | number;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
};

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  selectable?: boolean;
  selected?: Array<string | number>;
  onSelect?: (rowId: string | number, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc' | null;
  compact?: boolean;
}

export default function DataTable<T extends { id: string | number } & Record<string, any> = any>(props: DataTableProps<T>) {
  const {
    columns,
    rows,
    selectable = false,
    selected = [],
    onSelect,
    onSelectAll,
    onSort,
    sortKey,
    sortDir,
    compact = false,
  } = props;
  const allSelected = rows.length > 0 && rows.every(r => selected.includes(r.id));
  const someSelected = rows.some(r => selected.includes(r.id));
  const onSelectFn = onSelect ?? (() => {});
  const onSelectAllFn = onSelectAll ?? (() => {});
  const onSortFn = onSort ?? (() => {});

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <Table size="small" className={compact ? 'data-table-compact' : ''}>
        <TableHead>
          <TableRow>
            {selectable && (
                <TableCell style={{ width: 48 }}>
                <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSelectAllFn(e.target.checked)} aria-label="Select all rows" />
              </TableCell>
            )}
                {columns.map((col) => (
              <TableCell key={col.key} style={{ width: col.width, padding: compact ? '6px 12px' : undefined }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <strong>{col.title}</strong>
                  {col.sortable && (
                      <span style={{ cursor: 'pointer' }} onClick={() => onSortFn(col.key)}>
                        {sortKey === col.key && sortDir === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                      </span>
                    )}
                </div>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={columns.length + (selectable ? 1 : 0)} style={{ textAlign: 'center', padding: 20 }}>No results</TableCell></TableRow>
          )}
                {rows.map((r: any) => (
            <TableRow key={r.id} className={r.className || ''}>
              {selectable && (
                <TableCell>
                  <Checkbox checked={selected.includes(r.id)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSelectFn(r.id, e.target.checked)} inputProps={{ 'aria-label': `Select ${r.id}` }} />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell key={col.key} style={{ padding: compact ? '8px 12px' : undefined }}>{col.render ? col.render(r) : (r as any)[col.key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
