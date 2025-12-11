import SignUpContainer from '../../src/containers/SignUpContainer/SignUpContainer';
import ProtectedAuthRoute from '../../src/components/ProtectedAuthRoute';

export default function SignUpPage() {
  return (
    <ProtectedAuthRoute>
      <SignUpContainer />
    </ProtectedAuthRoute>
  );
}