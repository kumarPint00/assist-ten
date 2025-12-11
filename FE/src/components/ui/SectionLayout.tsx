import { Box } from '@mui/material';
import React from 'react';

type Props = { id?: string; children?: React.ReactNode; className?: string };

const SectionLayout = ({ id, children, className = '' }: Props) => {
  return (
    <Box id={id} className={`section-layout ${className}`} sx={{ px: { xs: 3, md: 6 }, py: { xs: 4, md: 6 } }}>
      {children}
    </Box>
  );
};

export default SectionLayout;
