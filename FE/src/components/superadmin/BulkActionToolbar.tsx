"use client";
import React from 'react';
import { Box, Button, Typography, Menu, MenuItem } from '@mui/material';
import { FiMoreVertical } from 'react-icons/fi';

export default function BulkActionToolbar({ count, onAction }:{ count:number; onAction:(action:string)=>void }) {
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid #e6e6e6' }}>
      <Typography variant="body2">{count} selected</Typography>
      <Button variant='outlined' size='small' onClick={() => onAction('export')}>Export</Button>
      <Button variant='contained' size='small' onClick={() => onAction('publish')}>Publish</Button>
      <Button variant='outlined' size='small' color='error' onClick={() => onAction('delete')}>Delete</Button>
      <div style={{ marginLeft: 'auto' }}>
        <Button onClick={(e) => setAnchor(e.currentTarget)} startIcon={<FiMoreVertical />}>More</Button>
        <Menu anchorEl={anchor} open={open} onClose={() => setAnchor(null)}>
          <MenuItem onClick={() => { onAction('archive'); setAnchor(null); }}>Archive</MenuItem>
          <MenuItem onClick={() => { onAction('revoke'); setAnchor(null); }}>Revoke access</MenuItem>
        </Menu>
      </div>
    </Box>
  )
}
