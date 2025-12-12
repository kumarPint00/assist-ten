"use client";
import { Button } from '@mui/material';
import React from 'react';
import { motion } from 'framer-motion';

type Props = React.ComponentProps<typeof Button> & {
  variantStyle?: 'primary' | 'outline' | 'ghost';
  animated?: boolean;
};

const PrimaryButton = ({
  variantStyle = 'primary',
  children,
  animated = true,
  ...rest
}: Props) => {
  const getVariant = () => {
    switch (variantStyle) {
      case 'primary':
        return 'contained';
      case 'outline':
        return 'outlined';
      case 'ghost':
        return 'text';
      default:
        return 'contained';
    }
  };

  const variant = getVariant();

  const ButtonComponent = animated ? motion(Button) : Button;

  const motionProps = animated ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring" as const, stiffness: 400, damping: 17 }
  } : {};

  return (
    <motion.div
      style={{ display: 'inline-block' }}
      {...motionProps}
    >
      <Button
        variant={variant}
        {...rest}
        sx={{
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '12px 24px',
          minHeight: '44px',
          transition: 'all 0.3s ease',
          ...(variant === 'contained' && {
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
            },
          }),
          ...(variant === 'outlined' && {
            color: '#6366f1',
            borderColor: '#6366f1',
            borderWidth: '2px',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.04)',
              borderColor: '#4f46e5',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)',
            },
          }),
          ...(variant === 'text' && {
            color: '#6366f1',
            backgroundColor: 'transparent',
            padding: '12px 16px',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
            },
          }),
          ...((rest as any).sx || {}),
        }}
      >
        {children}
      </Button>
    </motion.div>
  );
};

export default PrimaryButton;
