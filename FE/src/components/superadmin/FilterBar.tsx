"use client";
import React from 'react';
import { Box, TextField, Button, Chip } from '@mui/material';

export default function FilterBar({ children, onSearch, placeholder = 'Search...' } : { children?: React.ReactNode; onSearch?: (q: string) => void; placeholder?: string }) {
  const [q, setQ] = React.useState('');
  return (
    <Box sx={{ display: 'flex', gap: 12, alignItems: 'center', mb: 1.5, px: 1.5, py: 1, backgroundColor: '#fff', borderRadius: 15, boxShadow: '0 18px 40px rgba(15,23,42,0.12)' }}>
      <TextField size="small" value={q} placeholder={placeholder} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 260, backgroundColor: '#f4f6fb', borderRadius: 12 }} />
      <Button variant="contained" onClick={() => onSearch && onSearch(q)} sx={{ textTransform: 'none', boxShadow: 'none' }}>Search</Button>
      <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{children}</Box>
    </Box>
  )
}
