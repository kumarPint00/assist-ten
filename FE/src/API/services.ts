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

// ============ RECRUITER / INTERVIEWER / PROCTORING / NOTIFICATIONS TYPES & SERVICES ============

export interface JobRequisitionCreateRequest {
  title: string;
  description: string;
  department?: string;
  location?: string;
  employment_type: string;
  required_skills?: Record<string, string>;
  experience_level: string;
  min_experience_years?: number;
  max_experience_years?: number;
  min_salary?: number;
  max_salary?: number;
  currency?: string;
  positions_available?: number;
  jd_id?: string;
  assessment_id?: string;
  hiring_manager_id?: number;
}

export interface JobRequisitionResponseType {
  id: number;
  requisition_id: string;
  title: string;
  description: string;
  department?: string;
  location?: string;
  employment_type: string;
  required_skills: Record<string, string>;
  experience_level: string;
  min_experience_years?: number;
  max_experience_years?: number;
  min_salary?: number;
  max_salary?: number;
  currency: string;
  positions_available: number;
  positions_filled: number;
  status: string;
  is_published: boolean;
  published_at?: string;
  closes_at?: string;
  total_applicants: number;
  total_interviewed: number;
  total_hired: number;
  created_at: string;
  updated_at: string;
}

export const recruiterService = {
  createRequisition: async (data: JobRequisitionCreateRequest): Promise<JobRequisitionResponseType> => {
    const response = await apiClient.post<JobRequisitionResponseType>('/recruiter/requisitions', data);
    return response.data;
  },

  listRequisitions: async (page = 1, per_page = 20): Promise<JobRequisitionResponseType[]> => {
    const response = await apiClient.get<JobRequisitionResponseType[]>(`/recruiter/requisitions?page=${page}&per_page=${per_page}`);
    return response.data;
  },

  getRequisition: async (requisitionId: string): Promise<JobRequisitionResponseType> => {
    const response = await apiClient.get<JobRequisitionResponseType>(`/recruiter/requisitions/${requisitionId}`);
    return response.data;
  },

  updateRequisition: async (requisitionId: string, data: Partial<JobRequisitionCreateRequest>): Promise<JobRequisitionResponseType> => {
    const response = await apiClient.patch<JobRequisitionResponseType>(`/recruiter/requisitions/${requisitionId}`, data);
    return response.data;
  },

  publishRequisition: async (requisitionId: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/recruiter/requisitions/${requisitionId}/publish`);
    return response.data;
  },

  addApplicationNote: async (applicationId: string, note: { note_text: string; note_type?: string; is_private?: boolean }) => {
    const response = await apiClient.post(`/recruiter/applications/${applicationId}/notes`, note);
    return response.data;
  },

  listApplicationNotes: async (applicationId: string) => {
    const response = await apiClient.get(`/recruiter/applications/${applicationId}/notes`);
    return response.data;
  },
};

// Interviewer types & service
export interface InterviewSessionCreateRequest {
  candidate_id: number;
  requisition_id?: string;
  assessment_application_id?: string;
  interview_type: string;
  interview_mode: string;
  scheduled_at: string;
  duration_minutes?: number;
  timezone?: string;
  additional_interviewers?: number[];
  preparation_notes?: string;
  question_guide?: Record<string, any>;
  meeting_link?: string;
  meeting_room?: string;
}

export interface InterviewSessionResponseType {
  id: number;
  interview_id: string;
  interview_type: string;
  interview_mode: string;
  candidate_id: number;
  requisition_id?: string;
  assessment_application_id?: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  interviewer_id: number;
  additional_interviewers: number[];
  status: string;
  created_at: string;
  updated_at: string;
}

export const interviewerService = {
  scheduleInterview: async (data: InterviewSessionCreateRequest): Promise<InterviewSessionResponseType> => {
    const response = await apiClient.post<InterviewSessionResponseType>('/interviewer/interviews', data);
    return response.data;
  },

  listMyInterviews: async (): Promise<InterviewSessionResponseType[]> => {
    const response = await apiClient.get<InterviewSessionResponseType[]>('/interviewer/interviews');
    return response.data;
  },

  getInterview: async (id: string): Promise<InterviewSessionResponseType> => {
    const response = await apiClient.get<InterviewSessionResponseType>(`/interviewer/interviews/${id}`);
    return response.data;
  },

  updateInterview: async (id: string, data: Partial<InterviewSessionCreateRequest>): Promise<InterviewSessionResponseType> => {
    const response = await apiClient.patch<InterviewSessionResponseType>(`/interviewer/interviews/${id}`, data);
    return response.data;
  },

  startInterview: async (id: string) => {
    const response = await apiClient.post(`/interviewer/interviews/${id}/start`);
    return response.data;
  },

  completeInterview: async (id: string) => {
    const response = await apiClient.post(`/interviewer/interviews/${id}/complete`);
    return response.data;
  },

  submitFeedback: async (data: any) => {
    const response = await apiClient.post('/interviewer/feedback', data);
    return response.data;
  },

  getFeedback: async (interviewId: string) => {
    const response = await apiClient.get(`/interviewer/feedback/${interviewId}`);
    return response.data;
  },
};

// Proctoring
export const proctoringService = {
  logEvent: async (data: any) => {
    const response = await apiClient.post('/proctoring/events', data);
    return response.data;
  },

  listEvents: async () => {
    const response = await apiClient.get('/proctoring/events');
    return response.data;
  },

  reviewEvent: async (eventId: string, review: { reviewer_notes?: string; flagged?: boolean }) => {
    const response = await apiClient.patch(`/proctoring/events/${eventId}/review`, review);
    return response.data;
  },
};

// Notifications
export const notificationService = {
  listMyNotifications: async () => {
    const response = await apiClient.get('/notifications/');
    return response.data;
  },

  markRead: async (notificationId: string, isRead = true) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`, { is_read: isRead });
    return response.data;
  },

  archiveNotification: async (notificationId: string) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  createNotification: async (payload: any) => {
    const response = await apiClient.post('/notifications', payload);
    return response.data;
  },
};

// Superadmin services (basic)
export const superadminService = {
  listAuditLogs: async (limit = 100) => {
    const response = await apiClient.get(`/superadmin/audit-logs?limit=${limit}`);
    return response.data;
  },

  createTenant: async (payload: any) => {
    const response = await apiClient.post('/superadmin/tenants', payload);
    return response.data;
  },

  updateTenant: async (tenantId: string, payload: any) => {
    const response = await apiClient.patch(`/superadmin/tenants/${tenantId}`, payload);
    return response.data;
  },

  createIncident: async (payload: any) => {
    const response = await apiClient.post('/superadmin/incidents', payload);
    return response.data;
  },

  updateIncident: async (incidentId: string, payload: any) => {
    const response = await apiClient.patch(`/superadmin/incidents/${incidentId}`, payload);
    return response.data;
  },

  recordMetric: async (payload: any) => {
    const response = await apiClient.post('/superadmin/metrics', payload);
    return response.data;
  },

  createFlag: async (payload: any) => {
    const response = await apiClient.post('/superadmin/flags', payload);
    return response.data;
  },

  updateFlag: async (flagId: string, payload: any) => {
    const response = await apiClient.patch(`/superadmin/flags/${flagId}`, payload);
    return response.data;
  },
};

// Admin client
export const adminService = {
  listRequisitions: async (status?: string, is_published?: boolean) => {
    const params = new URLSearchParams({ ...(status ? { status } : {}), ...(is_published !== undefined ? { is_published: String(is_published) } : {}) });
    const response = await apiClient.get(`/admin/requisitions?${params.toString()}`);
    return response.data;
  },

  updateRequisitionStatus: async (requisitionId: string, payload: { status?: string; is_published?: boolean }) => {
    const response = await apiClient.patch(`/admin/requisitions/${requisitionId}/status`, payload);
    return response.data;
  },

  listApplications: async (status?: string) => {
    const params = new URLSearchParams({ ...(status ? { status } : {}) });
    const response = await apiClient.get(`/admin/applications?${params.toString()}`);
    return response.data;
  },

  updateApplicationStatus: async (applicationId: string, payload: { status: string; note?: string }) => {
    const response = await apiClient.patch(`/admin/applications/${applicationId}/status`, payload);
    return response.data;
  },

  bulkNotifications: async (payload: any) => {
    const response = await apiClient.post('/admin/notifications/bulk', payload);
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
