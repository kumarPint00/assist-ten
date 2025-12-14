"use client";
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogActions, Button, Typography } from '@mui/material';

export default function ConfirmModal({ open, title, message, onConfirm, onClose } : { open: boolean; title: string; message: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={() => { onConfirm(); onClose(); }}>Confirm</Button>
      </DialogActions>
    </Dialog>
  )
}
