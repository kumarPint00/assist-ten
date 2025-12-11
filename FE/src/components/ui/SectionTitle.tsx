import React from 'react';
import { Typography } from '@mui/material';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="h4" sx={{ fontWeight: 700, color: '#e6f0ff', mb: 2 }}>{children}</Typography>
);

export default SectionTitle;
