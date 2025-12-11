import ProtectedRoute from '../../src/components/ProtectedRoute';
import AppLandingContainer from '../../src/containers/AppLandingContainer/AppLandingContainer';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppLandingContainer>
        {children}
      </AppLandingContainer>
    </ProtectedRoute>
  );
}