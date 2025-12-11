import React from 'react';
import { Box, Typography } from '@mui/material';

type Props = { title: string; description?: string; className?: string };

const InfoCard = ({ title, description, className = '' }: Props) => {
  return (
    <Box className={`info-card ${className}`} sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <Typography sx={{ fontWeight: 700, color: '#dfeefe' }}>{title}</Typography>
      {description && <Typography sx={{ mt: 1, color: '#a8b9d4' }}>{description}</Typography>}
    </Box>
  );
};

export default InfoCard;
