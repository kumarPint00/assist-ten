import axios from "axios";
import type { AxiosError, AxiosResponse } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/";
const API_V1 = `${API_BASE_URL}api/v1`;

const apiClient = axios.create({
  baseURL: API_V1,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  login_streak?: {
    current_streak: number;
    longest_streak: number;
  };
}

export interface UserProfile {
  topic: string;
  subtopics: string[];
  level: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin?: boolean;
  role?: string;
}

export interface Assessment {
  id: number;
  assessment_id: string;
  title: string;
  description?: string;
  job_title?: string;
  jd_id?: string;
  required_skills: Record<string, string>;
  required_roles: string[];
  question_set_id?: string;
  assessment_method: string;
  duration_minutes: number;
  is_questionnaire_enabled: boolean;
  is_interview_enabled: boolean;
  is_active: boolean;
  is_published: boolean;
  is_expired: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentCreateRequest {
  title: string;
  description?: string;
  job_title?: string;
  jd_id?: string;
  required_skills?: Record<string, string>;
  required_roles?: string[];
  question_set_id?: string;
  duration_minutes?: number;
  is_questionnaire_enabled?: boolean;
  is_interview_enabled?: boolean;
  expires_at?: string;
}

export interface Candidate {
  id: number;
  candidate_id: string;
  full_name: string;
  email: string;
  phone?: string;
  experience_level: string;
  skills: Record<string, string>;
  availability_percentage: number;
  created_at: string;
}

export interface AdminDashboardActivityItem {
  application_id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  assessment_title: string;
  status: string;
  score_percentage?: number | null;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface CandidateCreateRequest {
  full_name: string;
  email: string;
  phone?: string;
  experience_level: string;
  skills: Record<string, string>;
  availability_percentage?: number;
}

export interface EmailValidationResponse {
  email: string;
  is_available: boolean;
  existing_candidate_id?: string;
  message: string;
}

export interface MCQOption {
  option_id: string;
  text: string;
}

export interface MCQQuestion {
  question_id: number;
  question_text: string;
  options: MCQOption[];
  correct_answer?: string;
}

export interface QuestionSet {
  question_set_id: string;
  skill: string;
  level: string;
  total_questions: number;
  created_at: string;
  questions: MCQQuestion[];
}

export interface QuizStartResponse {
  session_id: string;
  question_set_id: string;
  skill: string;
  level: string;
  total_questions: number;
  started_at: string;
  questions: MCQQuestion[];
}

export interface QuizSubmitRequest {
  session_id: string;
  answers: { question_id: number; selected_answer: string }[];
}

export interface QuizResultResponse {
  session_id: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  score_percentage: number;
  passed: boolean;
  completed_at: string;
}

export interface SkillExtractionResponse {
  role: string;
  skills: string[];
  experience_level?: string;
  extracted_text?: string;
  // Optional fields returned by server when using LLM or enhanced extraction
  classified_skills?: { skill_name: string; proficiency_level?: string; category?: string }[];
  jd_skills?: string[];
  skill_durations?: Record<string, string>;
  documents?: { extraction_preview?: string }[];
}

export interface RecommendedCourse {
  name: string;
  topic: string;
  url: string;
  score: number;
  image?: string;
  collection: string;
  category: string;
  description: string;
}

export const authService = {
  login: async (email: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>("/auth/login", { email });
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("profileCompleted");
    localStorage.removeItem("userProfile");
  },
};

export const userService = {
  getCurrentUser: async (): Promise<any> => {
    const response = await apiClient.get(`/users/me`);
    return response.data;
  },
};

export const quizService = {
  generateMCQs: async (
    topic: string,
    level: string,
    subtopics: string[] = []
  ): Promise<QuestionSet> => {
    const params = new URLSearchParams({
      topic,
      level,
      ...(subtopics.length > 0 && { subtopics: subtopics.join(",") }),
    });
    const response = await apiClient.get<QuestionSet>(`/generate-mcqs/?${params}`);
    return response.data;
  },

  startQuiz: async (questionSetId: string): Promise<QuizStartResponse> => {
    const response = await apiClient.post<QuizStartResponse>("/questionset-tests/start", {
      question_set_id: questionSetId,
    });
    return response.data;
  },

  submitQuiz: async (
    sessionId: string,
    answers: { question_id: number; selected_answer: string }[]
  ): Promise<QuizResultResponse> => {
    const response = await apiClient.post<QuizResultResponse>("/questionset-tests/submit", {
      session_id: sessionId,
      answers,
    });
    return response.data;
  },

  getSubSkills: async (topic: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/subskills/?topic=${topic}`);
    return response.data;
  },
};

export const candidateService = {
  checkEmail: async (email: string): Promise<EmailValidationResponse> => {
    const response = await apiClient.get<EmailValidationResponse>(
      `/candidates/check-email?email=${encodeURIComponent(email)}`
    );
    return response.data;
  },

  createCandidate: async (data: CandidateCreateRequest): Promise<Candidate> => {
    const response = await apiClient.post<Candidate>("/candidates", data);
    return response.data;
  },

  getCandidate: async (candidateId: string): Promise<Candidate> => {
    const response = await apiClient.get<Candidate>(`/candidates/${candidateId}`);
    return response.data;
  },

  updateCandidate: async (
    candidateId: string,
    data: Partial<CandidateCreateRequest>
  ): Promise<Candidate> => {
    const response = await apiClient.patch<Candidate>(`/candidates/${candidateId}`, data);
    return response.data;
  },

  listCandidates: async (skip = 0, limit = 50): Promise<Candidate[]> => {
    const response = await apiClient.get<Candidate[]>(
      `/candidates?skip=${skip}&limit=${limit}`
    );
    return response.data;
  },

  saveCVData: async (cvData: {
    full_name?: string;
    email: string;
    phone?: string;
    location?: string;
    current_role?: string;
    current_company?: string;
    experience_years?: string;
    education?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    skills: string[];
    experience_level?: string;
    availability_percentage?: number;
  }): Promise<{ status: string; candidate_id: string; data: any }> => {
    const response = await apiClient.post<{ status: string; candidate_id: string; data: any }>(
      "/candidates/save-cv-data",
      cvData
    );
    return response.data;
  },
};

export const assessmentService = {
  listAssessments: async (
    isPublished?: boolean,
    skip = 0,
    limit = 50,
    showAll = false
  ): Promise<Assessment[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...(isPublished !== undefined && { is_published: isPublished.toString() }),
      ...(showAll && { show_all: "true" }),
    });
    const response = await apiClient.get<Assessment[]>(`/assessments?${params}`);
    return response.data;
  },

  getAssessment: async (assessmentId: string): Promise<Assessment> => {
    const response = await apiClient.get<Assessment>(`/assessments/${assessmentId}`);
    return response.data;
  },

  getById: async (assessmentId: string): Promise<Assessment> => {
    const response = await apiClient.get<Assessment>(`/assessments/${assessmentId}`);
    return response.data;
  },

  createAssessment: async (data: AssessmentCreateRequest): Promise<Assessment> => {
    const response = await apiClient.post<Assessment>("/assessments", data);
    return response.data;
  },

  updateAssessment: async (
    assessmentId: string,
    data: Partial<AssessmentCreateRequest>
  ): Promise<Assessment> => {
    const response = await apiClient.put<Assessment>(
      `/assessments/${assessmentId}`,
      data
    );
    return response.data;
  },

  deleteAssessment: async (assessmentId: string): Promise<void> => {
    await apiClient.delete(`/assessments/${assessmentId}`);
  },

  publishAssessment: async (assessmentId: string): Promise<Assessment> => {
    const response = await apiClient.post<Assessment>(
      `/assessments/${assessmentId}/publish`
    );
    return response.data;
  },
};

export const uploadService = {
  uploadJD: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ jd_id: string; title: string; extracted_text: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/upload-jd", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return response.data;
  },

  extractSkills: async (
    resumeFile: File,
    _jdFile?: File,
    _requirementFile?: File,
    _clientDocFile?: File
  , useLLM: boolean = true
  ): Promise<SkillExtractionResponse> => {
    const formData = new FormData();
    formData.append("file", resumeFile);

    const response = await apiClient.post<SkillExtractionResponse>(
      `/admin/extract-skills?doc_type=cv&use_llm=${useLLM ? 'true' : 'false'}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  skillMatch: async (
    cvFile: File,
    jdFile: File,
    useLLM: boolean = true
  ): Promise<{ success?: boolean; match_score?: number; matched_skills?: any[]; missing_skills?: string[]; extra_skills?: string[]; details?: any }> => {
    const formData = new FormData();
    formData.append("cv", cvFile);
    formData.append("jd", jdFile);
    const response = await apiClient.post(`/admin/skill-match?use_llm=${useLLM ? 'true' : 'false'}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    return response.data;
  },
  getSkillMatches: async (skip = 0, limit = 50): Promise<any[]> => {
    const response = await apiClient.get(`/admin/skill-matches?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  getSkillMatch: async (matchId: string): Promise<any> => {
    const response = await apiClient.get(`/admin/skill-matches/${matchId}`);
    return response.data;
  },
};

export const skillsService = {
  getSkillSuggestions: async (query: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(
      `/skills/suggestions?query=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  getRoleSuggestions: async (query: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(
      `/skills/roles?query=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  getAllSkills: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>("/skills");
    return response.data;
  },
};

export const coursesService = {
  getRecommendedCourses: async (
    topic: string,
    marks?: number
  ): Promise<{ recommended_courses: RecommendedCourse[] }> => {
    const params = new URLSearchParams({ topic });
    if (marks !== undefined) {
      params.append("marks", marks.toString());
    }
    const response = await apiClient.get(`/recommended-courses?${params}`);
    return response.data;
  },
};

export const dashboardService = {
  getUserDashboard: async (): Promise<{
    test_history: any[];
    stats: { total_tests: number; average_score: number };
  }> => {
    const response = await apiClient.get("/dashboard");
    return response.data;
  },

  getAdminActivity: async (): Promise<AdminDashboardActivityItem[]> => {
    const response = await apiClient.get<AdminDashboardActivityItem[]>("/admin/dashboard/activity");
    return response.data;
  },
};

export const adminService = {
  getSystemStats: async (): Promise<any> => {
    const response = await apiClient.get(`/admin/stats`);
    return response.data;
  },
  listAdmins: async (): Promise<any[]> => {
    const response = await apiClient.get(`/admin/users`);
    return response.data;
  },
  createAdminUser: async (email: string, full_name?: string, role?: string) : Promise<any> => {
    const response = await apiClient.post(`/admin/users`, { email, full_name, role });
    return response.data;
  },
  updateUserRole: async (userId: string | number, role: string): Promise<any> => {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  }
};

export const adminSettingsAPI = {
  getSettings: async (): Promise<{ settings: any }> => {
    const response = await apiClient.get("/admin/settings");
    return response.data;
  },
  updateSettings: async (settings: any): Promise<{ settings: any }> => {
    const response = await apiClient.put("/admin/settings", { settings });
    return response.data;
  },
};

export default apiClient;
