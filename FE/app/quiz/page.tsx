import ProtectedProfileQuizRoute from '../../src/components/ProtectedProfileQuizRoute';
import QuizContainer from '../../src/containers/QuizContainer/QuizContainer';

export default function QuizPage() {
  return (
    <ProtectedProfileQuizRoute>
      <QuizContainer />
    </ProtectedProfileQuizRoute>
  );
}