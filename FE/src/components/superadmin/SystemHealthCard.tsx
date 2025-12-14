"use client";
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function SystemHealthCard({ name, value, details, onAction }:{ name:string; value:number | string; details?:string; onAction?: ()=>void }){
  return (
    <Box sx={{ border: '1px solid #e6e6e6', padding: 12, borderRadius: 8, minWidth: 180 }}>
      <Typography variant='subtitle2'>{name}</Typography>
      <Typography variant='h4' sx={{ marginTop: 1 }}>{value}</Typography>
      {details && <Typography variant='body2' sx={{ marginTop: 1, color: '#666' }}>{details}</Typography>}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <Button size='small' variant='outlined' onClick={onAction}>Details</Button>
      </div>
    </Box>
  )
}
