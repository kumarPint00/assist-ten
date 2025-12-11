"use client";
import { Button } from '@mui/material';
import React from 'react';

type Props = React.ComponentProps<typeof Button> & { variantStyle?: 'primary' | 'outline' };

const PrimaryButton = ({ variantStyle = 'primary', children, ...rest }: Props) => {
  const variant = (variantStyle === 'primary' ? 'contained' : 'outlined') as
    | 'contained'
    | 'outlined'
    | undefined;

  const baseSx = variant === 'contained'
    ? { background: 'linear-gradient(90deg,#6ee7b6,#6c9cff)', color: '#052236', borderRadius: '999px', textTransform: 'none', fontWeight: 700 }
    : { borderRadius: '999px', textTransform: 'none', color: '#e6f0ff', borderColor: 'rgba(255,255,255,0.08)' };

  return (
    <Button variant={variant} {...rest} sx={[baseSx, (rest as any).sx]}>
      {children}
    </Button>
  );
};

export default PrimaryButton;
