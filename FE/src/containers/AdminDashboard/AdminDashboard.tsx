"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "../../hooks/navigation";
import { FiPlus, FiRefreshCw, FiAlertCircle, FiUsers, FiTrendingUp, FiCalendar, FiActivity, FiCheckCircle } from "react-icons/fi";
import Toast from "../../components/Toast/Toast";
import { assessmentService, dashboardService, userService } from "../../API/services";
import type { Assessment, AdminDashboardActivityItem } from "../../API/services";
import "./AdminDashboard.scss";

interface DashboardStats {
  total_assessments: number;
  pending: number;
  active: number;
  in_progress: number;
  completed: number;
  expired: number;
}

interface DisplayAssessment {
  id: string;
  assessment_id: string;
  candidate_name: string;
  candidate_email: string;
  role: string;
  skills: { name: string; level: string; isCore: boolean }[];
  status: "pending" | "active" | "in_progress" | "completed" | "expired";
  created_at: string;
  updated_at: string;
  expires_at?: string;
  assessment_method?: string;
}

interface ToastMessage {
  type: "success" | "error" | "info";
  message: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Screening",
  active: "Scheduled",
  in_progress: "Interviewing",
  completed: "Completed",
  expired: "Closed",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
};

interface RecentActivityRow {
  applicationId: string;
  candidate: string;
  job: string;
  statusLabel: string;
  statusClass: string;
  score: number;
  scoreLabel: string;
  updatedAt: number;
}

const formatStatusLabel = (status: string): string => {
  const raw = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  return raw.replace(/\b\w/g, (char) => char.toUpperCase());
};

const buildStatusClass = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

interface AlertEntry {
  candidate: string;
  job: string;
  reason: string;
  timestamp: string;
}

const FLAGGED_ALERTS: AlertEntry[] = [
  { candidate: "Maya Patel", job: "AI Research Engineer", reason: "Multiple tab/context switches", timestamp: "09:42 AM" },
  { candidate: "Jordan Miles", job: "Product Data Scientist", reason: "Camera disconnected during tech", timestamp: "08:57 AM" },
  { candidate: "Rhea Singh", job: "Platform Engineer", reason: "Background noise spike while answering", timestamp: "Yesterday" },
];

const extractCandidateName = (description?: string, title?: string): string => {
  if (description) {
    const match = description.match(/candidate\s+(.+?)(?:\s*$|,)/i);
    if (match) return match[1].trim();
  }
  if (title && !title.toLowerCase().includes("assessment")) {
    return title;
  }
  return "Candidate";
};

const getAssessmentStatus = (a: Assessment): DisplayAssessment["status"] => {
  if (a.is_expired) {
    return "expired";
  }
  if (!a.is_published) {
    return "pending";
  }
  return a.is_active ? "in_progress" : "active";
};

const getDisplaySkills = (skills: Record<string, string>): { name: string; level: string; isCore: boolean }[] => {
  const skillEntries = Object.entries(skills || {});
  if (skillEntries.length === 0) return [];

  const highConfidenceLevels = ["expert", "advanced", "senior", "lead", "principal", "core", "5", "4", "3"];

  const allSkills = skillEntries.map(([name, level]) => ({
    name,
    level: String(level).toLowerCase(),
    isCore:
      highConfidenceLevels.some((hcl) => String(level).toLowerCase().includes(hcl)) ||
      (!isNaN(Number(level)) && Number(level) >= 3),
  }));

  allSkills.sort((a, b) => {
    if (a.isCore && !b.isCore) return -1;
    if (!a.isCore && b.isCore) return 1;
    return a.name.localeCompare(b.name);
  });

  return allSkills.slice(0, 5);
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState<DisplayAssessment[]>([]);
  const [activityRows, setActivityRows] = useState<AdminDashboardActivityItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_assessments: 0,
    pending: 0,
    active: 0,
    in_progress: 0,
    completed: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [interviewCredits] = useState(() => {
    const saved = localStorage.getItem("admin.interviewCredits");
    if (!saved) return 18;
    const parsed = parseInt(saved, 10);
    return Number.isNaN(parsed) ? 18 : parsed;
  });
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const user = await userService.getCurrentUser();
        setCurrentUserRole(user?.role ?? null);

        const [assessmentList, activity] = await Promise.all([
          assessmentService.listAssessments(undefined, 0, 50, user?.role === "superadmin"),
          dashboardService.getAdminActivity(),
        ]);

        const displayData: DisplayAssessment[] = assessmentList.map((a: Assessment) => ({
          id: a.id.toString(),
          assessment_id: a.assessment_id,
          candidate_name: extractCandidateName(a.description, a.title),
          candidate_email: "",
          role: a.job_title || a.title || "Unassigned role",
          skills: getDisplaySkills(a.required_skills),
          status: getAssessmentStatus(a),
          created_at: a.created_at,
          updated_at: a.updated_at,
          expires_at: a.expires_at,
          assessment_method: a.assessment_method,
        }));

        setAssessments(displayData);
        setActivityRows(activity);

        const calculatedStats: DashboardStats = {
          total_assessments: displayData.length,
          pending: displayData.filter((a) => a.status === "pending").length,
          active: displayData.filter((a) => a.status === "active").length,
          in_progress: displayData.filter((a) => a.status === "in_progress").length,
          completed: displayData.filter((a) => a.status === "completed").length,
          expired: displayData.filter((a) => a.status === "expired").length,
        };

        setStats(calculatedStats);
        setLastSyncedAt(new Date().toISOString());

        if (activity.length > 0) {
          setToast({ type: "success", message: `Recent activity synced (${activity.length} records)` });
        }
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        let errorMessage = "Failed to load dashboard data.";
        if (err.response?.status === 401) {
          errorMessage = "Session expired. Please log in again.";
        } else if (!err.response) {
          errorMessage = "Unable to reach the server.";
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [retryCount]);

  const recentActivity = useMemo<RecentActivityRow[]>(() => {
    return activityRows
      .map((entry) => {
        const statusLabel = formatStatusLabel(entry.status);
        const statusClass = buildStatusClass(statusLabel);
        const hasScore = typeof entry.score_percentage === "number";
        const scoreValue = hasScore
          ? Math.max(0, Math.min(100, Math.round(entry.score_percentage ?? 0)))
          : 0;
        const scoreLabel = hasScore ? `${scoreValue}%` : "N/A";

        return {
          applicationId: entry.application_id,
          candidate: entry.candidate_name || entry.candidate_email,
          job: entry.job_title,
          statusLabel,
          statusClass,
          score: scoreValue,
          scoreLabel,
          updatedAt: entry.updated_at ? new Date(entry.updated_at).getTime() : 0,
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8);
  }, [activityRows]);

  const shortlistedCandidates = activityRows.filter((entry) => entry.status === "shortlisted").length;
  const activeJobsCount = useMemo(() => {
    const roles = new Set<string>();
    assessments.forEach((assessment) => {
      if (["pending", "active", "in_progress"].includes(assessment.status)) {
        if (assessment.role) {
          roles.add(assessment.role);
        } else {
          roles.add(assessment.assessment_id);
        }
      }
    });
    return roles.size;
  }, [assessments]);

  const scoredEntries = activityRows.filter((entry) => typeof entry.score_percentage === "number");
  const averageScore = scoredEntries.length
    ? Math.round(
        scoredEntries.reduce((sum, entry) => sum + (entry.score_percentage ?? 0), 0) / scoredEntries.length
      )
    : 0;

  const stageChartData = [
    { label: "Screening", value: stats.pending },
    { label: "Scheduled", value: stats.active },
    { label: "In Progress", value: stats.in_progress },
    { label: "Completed", value: stats.completed },
  ];

  const maxStageValue = Math.max(...stageChartData.map((stage) => stage.value), 1);

  const sparklineValues = recentActivity
    .filter((entry) => entry.scoreLabel !== "N/A")
    .slice(-6);

  const handleRetry = () => setRetryCount((prev) => prev + 1);
  return (
    <div className="admin-dashboard">
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <div className="top-bar">
        <div>
          <p className="eyebrow">Company view</p>
          <h1>Hiring Activity Dashboard</h1>
          <p className="sync-text">Last sync: {new Date(lastSyncedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
        </div>
        <div className="top-bar-actions">
          <button className="icon-btn" onClick={handleRetry} title="Refresh dashboard">
            <FiRefreshCw size={18} />
          </button>
          <button className="btn btn-primary btn-new" onClick={() => navigate("/admin/assessment")}>
            <FiPlus size={16} />
            <span>New assessment</span>
          </button>
          {currentUserRole === "superadmin" && (
            <button className="btn btn-secondary" onClick={() => navigate("/admin/super")}>System stats</button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <div className="error-content">
            <FiAlertCircle size={20} className="error-icon" />
            <span>{error}</span>
            <button className="btn-link" onClick={handleRetry}>Try again</button>
          </div>
        </div>
      )}

      <section className="kpi-row">
        <article className="kpi-card">
          <div className="kpi-icon">
            <FiUsers size={18} />
          </div>
          <p className="kpi-label">Active jobs</p>
          <p className="kpi-value">{activeJobsCount}</p>
          <p className="kpi-detail">Live requisitions</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon">
            <FiActivity size={18} />
          </div>
          <p className="kpi-label">Interviews in progress</p>
          <p className="kpi-value">{stats.in_progress}</p>
          <p className="kpi-detail">{stats.in_progress || 0} ongoing</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon">
            <FiCheckCircle size={18} />
          </div>
          <p className="kpi-label">Completed interviews</p>
          <p className="kpi-value">{stats.completed}</p>
          <p className="kpi-detail">This cycle</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon">
            <FiUsers size={18} />
          </div>
          <p className="kpi-label">Shortlisted candidates</p>
          <p className="kpi-value">{shortlistedCandidates}</p>
          <p className="kpi-detail">Based on latest interviews</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon">
            <FiCalendar size={18} />
          </div>
          <p className="kpi-label">Interviews remaining</p>
          <p className="kpi-value">{interviewCredits}</p>
          <p className="kpi-detail">Credits left</p>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon">
            <FiTrendingUp size={18} />
          </div>
          <p className="kpi-label">Average candidate score</p>
          <p className="kpi-value">{averageScore}%</p>
          <div className="sparkline">
            {sparklineValues.map((entry, index) => (
              <span key={`${entry.candidate}-${index}`} style={{ height: `${entry.score}%` }}></span>
            ))}
          </div>
        </article>
        <article className="kpi-card">
          <div className="kpi-icon">
            <FiAlertCircle size={18} />
          </div>
          <p className="kpi-label">Proctoring alerts</p>
          <p className="kpi-value">{FLAGGED_ALERTS.length}</p>
          <p className="kpi-detail">Flagged interviews</p>
        </article>
      </section>

      <section className="secondary-section">
        <div className="chart-card">
          <div className="panel-heading">
            <h2>Interviews by stage</h2>
            <span>{stats.total_assessments} total</span>
          </div>
          <div className="chart-bars">
            {stageChartData.map((stage) => (
              <div className="chart-bar" key={stage.label}>
                <span className="bar-value" style={{ height: `${(stage.value / maxStageValue) * 100}%` }}></span>
                <p>{stage.label}</p>
                <small>{stage.value}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="alerts-card">
          <div className="panel-heading">
            <h2>Alerts</h2>
            <span>Flagged interviews</span>
          </div>
          <ul className="alerts-list">
            {FLAGGED_ALERTS.map((alert) => (
              <li key={`${alert.candidate}-${alert.job}`}>
                <div>
                  <p className="alert-candidate">{alert.candidate}</p>
                  <p className="alert-job">{alert.job}</p>
                </div>
                <p className="alert-reason">{alert.reason}</p>
                <span className="alert-time">{alert.timestamp}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="main-section">
        <div className="activity-panel">
          <div className="panel-heading">
            <h2>Recent activity</h2>
            <span>{recentActivity.length} rows</span>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading interviews...</p>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="table-wrapper">
              <table className="recent-activity-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((row) => (
                    <tr key={row.applicationId}>
                      <td>{row.candidate}</td>
                      <td>{row.job}</td>
                      <td>
                        <span className={`status-pill status-${row.statusClass}`}>
                          {row.statusLabel}
                        </span>
                      </td>
                      <td>
                        <div className="score-bar">
                          <span style={{ width: `${row.score}%` }}></span>
                        </div>
                        <small>{row.scoreLabel}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-note">No interviews recorded yet.</p>
          )}
        </div>
        <div className="alerts-panel">
          <div className="panel-heading">
            <h2>Flagged interviews</h2>
          </div>
          <ul className="alerts-panel-list">
            {FLAGGED_ALERTS.map((alert) => (
              <li key={`${alert.candidate}-${alert.reason}`}>
                <div>
                  <p className="alert-candidate">{alert.candidate}</p>
                  <p className="alert-job">{alert.job}</p>
                </div>
                <span className="alert-time">{alert.timestamp}</span>
                <p className="alert-reason small">{alert.reason}</p>
              </li>
            ))}
          </ul>
          <button className="btn-link">View all alerts</button>
        </div>
      </section>

      <div className="footer-strip">
        <span>Need more credits? Contact your account team.</span>
        <span>Last updated {new Date(lastSyncedAt).toLocaleString([], { hour: "numeric", minute: "2-digit" })}</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
