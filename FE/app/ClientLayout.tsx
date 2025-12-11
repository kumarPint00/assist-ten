'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '../src/theme/theme'; // We'll create this
import { ToastProvider } from '../src/components/Toast/ToastProvider'; // We'll create this

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}