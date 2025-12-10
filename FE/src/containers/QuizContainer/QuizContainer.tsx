import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Snackbar,
  Alert,
} from "@mui/material";

import QuizInstructionsModal from "./components/QuizInstructionsModal";
import "./QuizContainer.scss";
import { quizService } from "../../API/services";
import type { MCQQuestion, QuestionSet } from "../../API/services";
import Loader from "../../components/Loader";
import { useNavigate, useLocation } from "react-router-dom";
import ErrorMessage from "../../components/ErrorMessage/ErrorMessage";

interface LocationState {
  assessmentId?: string;
  assessment?: {
    required_skills?: Record<string, string>;
    duration_minutes?: number;
    title?: string;
  };
  fromCandidateLink?: boolean;
}

const QuizContainer = () => {
  const [showModal, setShowModal] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selectedOption, setSelected] = useState("");
  const [quizTimer] = useState(300); // 5mins
  const [questionTimer, setQuestionTimer] = useState(30);
  const [leftFullscreenCount, setLeftFullscreenCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<
    { question_id: number; selected_answer: string }[]
  >([]);
  const [question, setQuestion] = useState<MCQQuestion>({
    question_id: 0,
    question_text: "",
    options: [] as { option_id: string; text: string }[],
    correct_answer: "",
  });

  const [mcqQuestions, setMcqQuestions] = useState<QuestionSet>({
    question_set_id: "",
    skill: "",
    level: "",
    total_questions: 0,
    created_at: "",
    questions: [],
  });
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  
  // Try to get assessment data from location state first, then localStorage
  const getAssessmentData = () => {
    if (locationState?.fromCandidateLink && locationState?.assessment) {
      return { assessment: locationState.assessment, fromCandidateLink: true };
    }
    // Fallback to localStorage
    const stored = localStorage.getItem("currentAssessment");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { assessment: parsed, fromCandidateLink: true };
      } catch {
        return { assessment: null, fromCandidateLink: false };
      }
    }
    return { assessment: null, fromCandidateLink: false };
  };
  
  const { assessment: assessmentData, fromCandidateLink: isFromCandidateLink } = getAssessmentData();

  const getMCQsBasedOnProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let topic = "";
      let level = "intermediate";
      let subtopics: string[] = [];
      
      console.log("Assessment data:", assessmentData);
      console.log("Is from candidate link:", isFromCandidateLink);
      
      if (isFromCandidateLink && assessmentData?.required_skills) {
        const skills = Object.keys(assessmentData.required_skills);
        console.log("Skills from assessment:", skills);
        topic = skills[0] || "General";
        subtopics = skills.slice(1);
        const skillLevel = Object.values(assessmentData.required_skills)[0] as string;
        level = skillLevel || "intermediate";
      } else {
        const userProfile = localStorage.getItem("userProfile");
        const profileData = userProfile ? JSON.parse(userProfile) : {};
        topic = profileData.topic || "";
        level = profileData.level || "intermediate";
        subtopics = profileData.subtopics || [];
      }
      
      console.log("Topic:", topic, "Level:", level, "Subtopics:", subtopics);
      
      if (!topic) {
        setError("No topic specified for the quiz. Please set up your profile or use a valid assessment link.");
        setLoading(false);
        return;
      }
      
      const res = await quizService.generateMCQs(topic, level, subtopics);
      setMcqQuestions(res);
      const questionData = res.questions[current];
      setQuestion(questionData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching MCQs:", error);
      setError("Unable to load questions. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    getMCQsBasedOnProfile();
  }, []);

  const getQuizSessionId = async () => {
    if (!mcqQuestions.question_set_id) {
      setError("Questions not loaded. Please refresh and try again.");
      setToastMessage("Questions not loaded. Please refresh.");
      setShowToast(true);
      return;
    }
    
    try {
      const res = await quizService.startQuiz(mcqQuestions.question_set_id);
      setSessionId(res.session_id);
      setShowModal(false);
      document.documentElement.requestFullscreen();
      document.addEventListener("contextmenu", (e) => e.preventDefault());
      setQuizStarted(true);
    } catch (error) {
      console.error("Error starting quiz:", error);
      setError("Unable to start quiz. Please try again later.");
      setToastMessage("Error starting quiz. Please try again.");
      setShowToast(true);
    }
  };

  const startQuiz = () => {
    getQuizSessionId();
  };

  useEffect(() => {
    const handleExit = () => {
      if (!document.fullscreenElement) {
        setLeftFullscreenCount((prev) => prev + 1);
        setShowWarning(true);
      }
    };

    const handleTabChange = () => {
      if (document.hidden) {
        setLeftFullscreenCount((prev) => prev + 1);
        setShowWarning(true);
      }
    };

    document.addEventListener("fullscreenchange", handleExit);
    document.addEventListener("visibilitychange", handleTabChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleExit);
      document.removeEventListener("visibilitychange", handleTabChange);
    };
  }, []);

  useEffect(() => {
    if (leftFullscreenCount >= 2) {
      alert("Quiz submitted due to rule violation.");
      window.location.href = "/app/dashboard";
    }
  }, [leftFullscreenCount]);

  useEffect(() => {
    const blockEvents = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey &&
          ["c", "v", "s", "u", "p"].includes(e.key.toLowerCase())) ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const disableCopy = (e: ClipboardEvent) => e.preventDefault();
    const disableContext = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("keydown", blockEvents);
    document.addEventListener("copy", disableCopy);
    document.addEventListener("paste", disableCopy);
    document.addEventListener("contextmenu", disableContext);

    return () => {
      document.removeEventListener("keydown", blockEvents);
      document.removeEventListener("copy", disableCopy);
      document.removeEventListener("paste", disableCopy);
      document.removeEventListener("contextmenu", disableContext);
    };
  }, []);

  useEffect(() => {
    if (leftFullscreenCount >= 2) {
      setSubmitted(true);
    }
  }, [leftFullscreenCount]);

  useEffect(() => {
    if (!quizStarted) return;
    if (questionTimer === 0) {
      goNext();
      return;
    }

    const t = setInterval(() => setQuestionTimer((prev) => prev - 1), 1000);

    return () => clearInterval(t);
  }, [quizStarted, questionTimer]);

  const submitQuizAnswers = async (
    answers: { question_id: number; selected_answer: string }[]
  ) => {
    try {
      setLoading(true);
      const res = await quizService.submitQuiz(sessionId, answers);
      const score = res.score_percentage;
      localStorage.setItem("latestScore", score.toString());
      navigate("/app/dashboard");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error submitting quiz answers:", error);
    }
  };

  const goNext = () => {
    const currentQuestion = mcqQuestions.questions[current];

    setAnswers((prev) => [
      ...prev,
      {
        question_id: currentQuestion.question_id,
        selected_answer: selectedOption,
      },
    ]);

    if (current < mcqQuestions.questions.length - 1) {
      const question = mcqQuestions.questions[current + 1];
      setQuestion(question);
      setCurrent((prev) => prev + 1);
      setQuestionTimer(30);
      setSelected("");
    } else {
      setSubmitted(true);
    }
  };

  if (error) {
    return <ErrorMessage message={error} onRetry={getMCQsBasedOnProfile} />;
  }

  if (loading) {
    return <Loader fullscreen message="Loading AgenticAI assessment..." />;
  }

  if (submitted) {
    return (
      <Box className="submission-screen">
        <Typography className="submitted-title">Quiz Submitted</Typography>
        <Typography className="submitted-text">
          Thank you for completing the quiz.
        </Typography>

        <Button
          variant="contained"
          className="return-btn"
          onClick={() => {
            submitQuizAnswers(answers);
            if (document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
          }}
        >
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  if (showModal) {
    return <QuizInstructionsModal open={showModal} onStart={startQuiz} />;
  }

  return (
    <>
      <Box className="quiz-container">
        <Box className="progress-container">
          <LinearProgress
            variant="determinate"
            value={((current + 1) / mcqQuestions.questions.length) * 100}
            className="progress-bar"
          />
          <Typography className="progress-text">
            Question {current + 1} of {mcqQuestions.questions.length}
          </Typography>
        </Box>

        {showWarning && (
          <Box className="warning-modal">
            <Box className="warning-box">
              <Typography className="warning-title">Warning</Typography>
              <Typography className="warning-message">
                You exited fullscreen or switched tabs. Doing this again will
                submit your quiz.
              </Typography>
              <Button
                variant="contained"
                className="warning-btn"
                onClick={() => {
                  setShowWarning(false);
                  document.documentElement.requestFullscreen().catch(() => {});
                }}
              >
                Continue Quiz
              </Button>
            </Box>
          </Box>
        )}

        <Box className="quiz-header">
          <Typography className="timer">Quiz Time: {quizTimer}s</Typography>
          <Typography className="timer">
            Question Time: {questionTimer}s
          </Typography>
        </Box>

        <Typography className="quiz-question">
          {question.question_text}
        </Typography>

        <RadioGroup
          value={selectedOption}
          onChange={(e) => setSelected(e.target.value)}
        >
          {question.options.map((opt) => (
            <FormControlLabel
              key={opt.option_id}
              value={opt.option_id}
              control={<Radio />}
              label={opt.text}
            />
          ))}
        </RadioGroup>

        <Button
          className="next-btn"
          variant="contained"
          onClick={goNext}
          disabled={!selectedOption}
        >
          Next
        </Button>
      </Box>
      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" variant="filled">
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default QuizContainer;
