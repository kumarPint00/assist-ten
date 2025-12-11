import React from 'react';
import { Box, Typography } from '@mui/material';

const Logo = ({ size = 28 }: { size?: number }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box sx={{ width: size, height: size, borderRadius: 1, background: '#3b2bee' }} />
    <Typography sx={{ color: '#e6f0ff', fontWeight: 700 }}>Assist-Ten</Typography>
  </Box>
);

export default Logo;
