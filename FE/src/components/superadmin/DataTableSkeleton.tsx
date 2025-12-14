"use client";
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';

export default function DataTableSkeleton({ columns, rows } : { columns: string[]; rows: any[] }) {
  return (
    <Paper elevation={0} style={{ width: '100%', borderRadius: 8 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map(col => (<TableCell key={col}><strong>{col}</strong></TableCell>))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={columns.length} style={{ textAlign: 'center', padding: 24 }}>No data</TableCell></TableRow>
          )}
          {rows.map((r, idx) => (
            <TableRow key={idx}>{columns.map((c, i) => (<TableCell key={i}>{r[c] || ''}</TableCell>))}</TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
