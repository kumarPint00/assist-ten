'use client';

import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { usePathname } from 'next/navigation';
import { theme } from '../src/theme/theme';
import { ToastProvider } from '../src/components/Toast/ToastProvider';
import MainNavbar from './components/MainNavbar';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const hideNavbarPaths = ['/login', '/logout', '/signup'];
  const hideForLandingPage = pathname === '/';
  // Hide main navbar for admin routes to avoid duplicate navigation bars
  const hideForAdmin = pathname.startsWith('/admin');
  const showNavbar = !hideForLandingPage && !hideForAdmin && !hideNavbarPaths.some((path) => pathname.startsWith(path));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        {showNavbar && <MainNavbar />}
        <Box
          component="main"
          sx={{
            pt: showNavbar ? { xs: '64px', md: '72px' } : 0,
          }}
        >
          {children}
        </Box>
      </ToastProvider>
    </ThemeProvider>
  );
}