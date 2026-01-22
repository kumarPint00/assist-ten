"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "../../hooks/navigation";
import { FiPlus, FiRefreshCw, FiAlertCircle, FiUsers, FiTrendingUp, FiCalendar, FiActivity, FiCheckCircle } from "react-icons/fi";
import Toast from "../../components/Toast/Toast";
import TransformCVWidget from "../../components/admin/TransformCVWidget";
import { assessmentService, dashboardService, userService, proctoringService } from "../../API/services";
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

// Flagged alerts are now sourced from the backend proctoring events (see `proctoringService.listEvents`).

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

export const mapProctoringEventsToAlerts = (events: any[] = []): AlertEntry[] => {
  const flagged = (events || []).filter((e: any) => e.flagged === true || e.severity === 'high' || e.severity === 'critical');
  return flagged.map((e: any) => ({
    candidate: e.test_session?.candidate_name || e.test_session_candidate_name || e.test_session_id || 'Candidate',
    job: e.test_session?.job_title || e.job_title || '',
    reason: `${e.event_type}${e.event_metadata?.note ? ` — ${e.event_metadata.note}` : ''}`,
    timestamp: e.detected_at ? new Date(e.detected_at).toLocaleString([], { hour: 'numeric', minute: '2-digit' }) : new Date(e.created_at).toLocaleString(),
  }));
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
  const [flaggedAlerts, setFlaggedAlerts] = useState<AlertEntry[]>([]);
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

        let assessmentList: Assessment[] = [];
        let activity: AdminDashboardActivityItem[] = [];
        let proctoringEvents: any[] = [];

        try {
          [assessmentList, activity, proctoringEvents] = await Promise.all([
            assessmentService.listAssessments(undefined, 0, 50, user?.role === "superadmin"),
            dashboardService.getAdminActivity(),
            proctoringService.listEvents(),
          ]);
        } catch (err) {
          // Some admin endpoints require admin/superadmin roles. We'll fetch what we can and fall back.
          console.warn('Could not fetch one or more admin endpoints, attempting partial fetch', err);
          try {
            assessmentList = await assessmentService.listAssessments(undefined, 0, 50, user?.role === "superadmin");
          } catch (e) { assessmentList = []; }
          try {
            activity = await dashboardService.getAdminActivity();
          } catch (e) { activity = []; }
          try {
            proctoringEvents = await proctoringService.listEvents();
          } catch (e) { proctoringEvents = []; }
        }

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

        // If admin stats endpoint is not available to the current user, compute stats locally
        const calculatedStats: DashboardStats = {
          total_assessments: displayData.length,
          pending: displayData.filter((a) => a.status === "pending").length,
          active: displayData.filter((a) => a.status === "active").length,
          in_progress: displayData.filter((a) => a.status === "in_progress").length,
          completed: displayData.filter((a) => a.status === "completed").length,
          expired: displayData.filter((a) => a.status === "expired").length,
        };

        // Try to call adminService.getSystemStats() only if user is superadmin; otherwise fallback to our calculated stats
        try {
          if (user?.role === 'superadmin') {
            const sys = await (await import('../../API/services')).adminService.getSystemStats();
            // map some compatible fields if present
            setStats({
              total_assessments: sys.total_assessments ?? calculatedStats.total_assessments,
              pending: sys.pending ?? calculatedStats.pending,
              active: sys.active ?? calculatedStats.active,
              in_progress: sys.in_progress ?? calculatedStats.in_progress,
              completed: sys.completed ?? calculatedStats.completed,
              expired: sys.expired ?? calculatedStats.expired,
            });
          } else {
            setStats(calculatedStats);
          }
        } catch (e) {
          setStats(calculatedStats);
        }
        setLastSyncedAt(new Date().toISOString());

        if (activity.length > 0) {
          setToast({ type: "success", message: `Recent activity synced (${activity.length} records)` });
        }

        // Map proctoring events to alert entries (only flagged or high severity)
        try {
          const flagged = (proctoringEvents || []).filter((e: any) => e.flagged === true || e.severity === 'high' || e.severity === 'critical');
          const mappedAlerts: AlertEntry[] = flagged.map((e: any) => ({
            candidate: e.test_session?.candidate_name || e.test_session_candidate_name || e.test_session_id || 'Candidate',
            job: e.test_session?.job_title || e.job_title || '',
            reason: `${e.event_type}${e.event_metadata?.note ? ` — ${e.event_metadata.note}` : ''}`,
            timestamp: e.detected_at ? new Date(e.detected_at).toLocaleString([], { hour: 'numeric', minute: '2-digit' }) : new Date(e.created_at).toLocaleString(),
          }));
          setFlaggedAlerts(mappedAlerts.slice(0, 8));
        } catch (err) {
          console.warn('Could not map proctoring events', err);
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

  const requirementTrends = useMemo(() => {
    const skillCounts = new Map<string, number>();
    assessments.forEach((assessment) => {
      (assessment.skills || []).forEach((skill) => {
        const label = skill.name || "—";
        skillCounts.set(label, (skillCounts.get(label) ?? 0) + 1);
      });
    });

    return Array.from(skillCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [assessments]);

  const upcomingAssessments = useMemo(() => {
    return assessments
      .filter((assessment) => ["pending", "active", "in_progress"].includes(assessment.status))
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aTime - bTime;
      })
      .slice(0, 4);
  }, [assessments]);


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

      <section className="summary-grid">
        <article className="panel assessment-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Info related to assessment</p>
              <h2>Assessment overview</h2>
            </div>
            <span>{stats.total_assessments} assessments</span>
          </div>
          <div className="stage-bars">
            {stageChartData.map((stage) => (
              <div className="stage-bar" key={stage.label}>
                <span className="stage-value" style={{ height: `${(stage.value / maxStageValue) * 100}%` }}></span>
                <p>{stage.label}</p>
                <small>{stage.value}</small>
              </div>
            ))}
          </div>
          <div className="status-list">
            {stageChartData.map((stage) => (
              <div className="status-row" key={stage.label}>
                <span>{stage.label}</span>
                <strong>{stage.value}</strong>
              </div>
            ))}
          </div>
          <div className="upcoming-roles">
            <p className="upcoming-label">Active teasers</p>
            {upcomingAssessments.length ? (
              upcomingAssessments.map((assessment) => {
                const statusLabel = formatStatusLabel(assessment.status);
                return (
                  <div className="upcoming-row" key={assessment.id}>
                    <div>
                      <p className="upcoming-job">{assessment.role}</p>
                      <small>{new Date(assessment.created_at).toLocaleDateString()}</small>
                    </div>
                    <span className={`status-pill status-${buildStatusClass(statusLabel)}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="empty-note">No published assessments yet.</p>
            )}
          </div>
        </article>
        <article className="panel candidate-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Info related to candidates</p>
              <h2>Candidate snapshot</h2>
            </div>
            <div className="sparkline">
              {sparklineValues.map((entry, index) => (
                <span key={`${entry.candidate}-${index}`} style={{ height: `${entry.score}%` }}></span>
              ))}
            </div>
          </div>
          <div className="candidate-cards">
            <div className="candidate-card">
              <p className="card-label">Shortlisted</p>
              <p className="card-value">{shortlistedCandidates}</p>
              <p className="card-detail">Latest interviews</p>
            </div>
            <div className="candidate-card">
              <p className="card-label">Avg. score</p>
              <p className="card-value">{averageScore}%</p>
              <p className="card-detail">Based on {scoredEntries.length} completed</p>
            </div>
            <div className="candidate-card">
              <p className="card-label">Active sessions</p>
              <p className="card-value">{stats.in_progress}</p>
              <p className="card-detail">In progress</p>
            </div>
            <div className="candidate-card">
              <p className="card-label">Active jobs</p>
              <p className="card-value">{activeJobsCount}</p>
              <p className="card-detail">Live requisitions</p>
            </div>
          </div>
        </article>
        <article className="panel requirements-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Requirement highlights</p>
              <h2>Core skills</h2>
            </div>
            <span>{requirementTrends.length} key areas</span>
          </div>
          <div className="requirement-trends">
            {requirementTrends.length ? (
              requirementTrends.map((trend) => (
                <div className="trend-chip" key={trend.name}>
                  <strong>{trend.name}</strong>
                  <small>{trend.count} assessments</small>
                </div>
              ))
            ) : (
              <p className="empty-note">Requirements not available yet.</p>
            )}
          </div>
          <p className="requirement-note">Tracking {assessments.length} total assessments.</p>
        </article>
      </section>

      <section className="operations-grid">
        <article className="panel operations-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">OPerations</p>
              <h2>Activity log</h2>
            </div>
            <div className="operations-actions">
              <button className="btn-link" onClick={handleRetry}>Refresh</button>
              <button className="btn btn-primary" onClick={() => navigate("/admin/assessment")}>New assessment</button>
            </div>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading activity…</p>
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
        </article>
        <article className="panel highlights-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Other important highlighted information</p>
              <h2>Alerts & focus</h2>
            </div>
            <span>Synced {new Date(lastSyncedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          </div>
          <div className="highlights-list">
            <p className="highlight-title">Flagged interviews</p>
            <ul>
              {flaggedAlerts.length > 0 ? (
                flaggedAlerts.map((alert) => (
                  <li key={`${alert.candidate}-${alert.reason}-${alert.timestamp}`}>
                    <div>
                      <p className="alert-candidate">{alert.candidate}</p>
                      <p className="alert-job">{alert.job}</p>
                    </div>
                    <span className="alert-time">{alert.timestamp}</span>
                    <p className="alert-reason small">{alert.reason}</p>
                  </li>
                ))
              ) : (
                <li className="empty-roster">No flagged interviews</li>
              )}
            </ul>
          </div>
          {/* Transform CV widget for admin use */}
          <TransformCVWidget />
          <p className="highlight-note"><strong>Last update:</strong> {new Date(lastSyncedAt).toLocaleString([], { hour: "numeric", minute: "2-digit" })}</p>
        </article>
      </section>

      <div className="footer-strip">
        <span>Need more credits? Contact your account team.</span>
        <span>Last updated {new Date(lastSyncedAt).toLocaleString([], { hour: "numeric", minute: "2-digit" })}</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
