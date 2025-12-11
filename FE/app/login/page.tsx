import LoginContainer from '../../src/containers/LoginContainer/LoginContainer';
import ProtectedAuthRoute from '../../src/components/ProtectedAuthRoute';

export default function LoginPage() {
  return (
    <ProtectedAuthRoute>
      <LoginContainer />
    </ProtectedAuthRoute>
  );
}