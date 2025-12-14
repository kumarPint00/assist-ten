"use client";
import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { FiAlertTriangle, FiCheckCircle, FiZap } from 'react-icons/fi';

export type AlertItem = { id: string; type: 'AI Failure' | 'Proctor Violation' | 'Billing'; severity: 'critical'|'warning'|'info'; message: string; time: string; resolved?: boolean };

export default function AlertsPanel({ items, onResolve }:{ items: AlertItem[]; onResolve?: (id: string)=>void }){
  const avatarBg = (severity: AlertItem['severity']) => {
    if (severity === 'critical') return 'rgba(239, 68, 68, 0.1)';
    if (severity === 'warning') return 'rgba(249, 115, 22, 0.15)';
    return 'rgba(16, 185, 129, 0.1)';
  };

  const iconMap = (severity: AlertItem['severity']) => {
    if (severity === 'critical') return <FiAlertTriangle color='red' />;
    if (severity === 'warning') return <FiZap color='#d97706' />;
    return <FiCheckCircle color='#059669' />;
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h6'>Alerts</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size='small'>Filter</Button>
          <Button size='small'>Export</Button>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {items.map(a => (
          <Box key={a.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: 2, borderRadius: 14, boxShadow: '0 10px 25px rgba(15,23,42,0.08)', backgroundColor: '#fff' }}>
            <Box sx={{ width: 42, height: 42, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: avatarBg(a.severity) }}>
              {iconMap(a.severity)}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{a.type}</Typography>
                <Typography variant='caption' color='text.secondary'>{new Date(a.time).toLocaleString()}</Typography>
              </Box>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, lineHeight: 1.4 }}>{a.message}</Typography>
            </Box>
            <Button size='small' onClick={() => onResolve && onResolve(a.id)}>
              {a.resolved ? 'Resolved' : 'Acknowledge'}
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
