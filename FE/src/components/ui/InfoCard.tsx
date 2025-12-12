import React from 'react';
import { Box, Typography } from '@mui/material';

type Props = {
  title: string;
  description?: string;
  className?: string;
  icon?: string;
  accentColor?: string;
  category?: string;
};

const InfoCard = ({ title, description, className = '', icon, accentColor, category }: Props) => {
  return (
    <Box
      className={`info-card ${className}`}
      sx={{
        p: 2,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined
      }}
    >
      {category && (
        <Typography sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: accentColor || '#6366f1',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          mb: 1
        }}>
          {category}
        </Typography>
      )}
      {icon && (
        <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>
          {icon}
        </Typography>
      )}
      <Typography sx={{ fontWeight: 700, color: '#dfeefe' }}>{title}</Typography>
      {description && <Typography sx={{ mt: 1, color: '#a8b9d4' }}>{description}</Typography>}
    </Box>
  );
};

export default InfoCard;
