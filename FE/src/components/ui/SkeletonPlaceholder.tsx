import React from 'react';
import { Box } from '@mui/material';

const SkeletonPlaceholder = ({ height = 200 }: { height?: number }) => (
  <Box sx={{ background: 'rgba(255,255,255,0.02)', borderRadius: 2, width: '100%', height }} />
);

export default SkeletonPlaceholder;
