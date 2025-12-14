"use client";
import React from 'react';
import { Paper, Typography } from '@mui/material';

export default function KpiCard({ title, value, sub, compact = false }: { title: string; value: string | number; sub?: string | null; compact?: boolean }) {
  const cardStyles: React.CSSProperties = {
    padding: compact ? 12 : 20,
    minWidth: compact ? 150 : 190,
    borderRadius: 16,
    border: compact ? '1px solid rgba(15,23,42,0.08)' : 'none',
    boxShadow: compact ? 'none' : '0 25px 45px rgba(15,23,42,0.15)',
    background: compact ? '#fff' : 'linear-gradient(180deg, #ffffff 10%, #eef2ff 100%)',
  };

  return (
    <Paper elevation={compact ? 0 : 3} style={cardStyles}>
      <Typography variant="subtitle2" color="textSecondary">{title}</Typography>
      <Typography variant="h5" style={{ marginTop: 10, fontWeight: 700 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="textSecondary" style={{ marginTop: 6 }}>{sub}</Typography>}
    </Paper>
  )
}
