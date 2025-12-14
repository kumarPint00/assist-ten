"use client";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "../../hooks/navigation";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiCheckCircle,
  FiUsers,
  FiFileText,
  FiLink,
  FiCopy,
  FiMail,
  FiCalendar,
  FiActivity,
  FiAlertCircle,
  FiSend,
  FiEyeOff,
} from "react-icons/fi";
import { assessmentService } from "../../API/services";
import type { Assessment } from "../../API/services";
import Toast from "../../components/Toast/Toast";
import "./AssessmentViewContainer.scss";

interface ToastMessage {
  type: "success" | "error" | "info";
  message: string;
}

const AssessmentViewContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!id) {
        setError("Assessment ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await assessmentService.getAssessment(id);
        setAssessment(data);
      } catch (err: any) {
        console.error("Error fetching assessment:", err);
        setError(err.response?.data?.detail || "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id]);

  const handleCopyLink = () => {
    if (assessment) {
      const link = `${window.location.origin}/candidate-assessment/${assessment.assessment_id}`;
      navigator.clipboard.writeText(link);
      setToast({ type: "success", message: "Assessment link copied to clipboard!" });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }

    try {
      await assessmentService.deleteAssessment(id!);
      setToast({ type: "success", message: "Assessment deleted successfully" });
      setTimeout(() => navigate("/admin/dashboard"), 1500);
    } catch (err: any) {
      setToast({ type: "error", message: err.response?.data?.detail || "Failed to delete assessment" });
      setDeleteConfirm(false);
    }
  };

  const handlePublish = async () => {
    if (!assessment) return;
    
    try {
      setPublishLoading(true);
      const updatedAssessment = await assessmentService.publishAssessment(assessment.assessment_id);
      setAssessment(updatedAssessment);
      setToast({ 
        type: "success", 
        message: updatedAssessment.is_published 
          ? "Assessment published successfully! Candidates can now access it." 
          : "Assessment unpublished. Candidates can no longer access it."
      });
    } catch (err: any) {
      setToast({ 
        type: "error", 
        message: err.response?.data?.detail || "Failed to update publish status" 
      });
    } finally {
      setPublishLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusInfo = () => {
    if (!assessment) return { label: "Unknown", color: "default", icon: <FiActivity /> };
    if (assessment.is_expired) {
      return { label: "Expired", color: "danger", icon: <FiAlertCircle /> };
    }
    if (assessment.is_published) {
      return { label: "Published", color: "success", icon: <FiCheckCircle /> };
    }
    return { label: "Draft", color: "warning", icon: <FiClock /> };
  };

  if (loading) {
    return (
      <div className="assessment-view-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="assessment-view-container">
        <div className="error-state">
          <FiAlertCircle size={48} />
          <h2>Error Loading Assessment</h2>
          <p>{error || "Assessment not found"}</p>
          <button className="btn btn-primary" onClick={() => navigate("/admin/dashboard")}>
            <FiArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const skills = Object.entries(assessment.required_skills || {});
  const groupedSkills = (
    skills.reduce((acc: any, [skill, level]) => {
      const mappedLevel = level === 'beginner' ? 'basic' : level === 'intermediate' ? 'intermediate' : 'advance';
      if (!acc[mappedLevel]) acc[mappedLevel] = [];
      acc[mappedLevel].push({ skill, level });
      return acc;
    }, {} as Record<string, any[]>)
  ) as Record<'basic'|'intermediate'|'advance'|'strong', any[]>;
  const assessmentLink = `${window.location.origin}/candidate-assessment/${assessment.assessment_id}`;

  return (
    <div className="assessment-view-container">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="view-header">
        <button className="btn-back" onClick={() => navigate("/admin/dashboard")}>
          <FiArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="header-actions">
          <button
            className={`btn ${assessment.is_published ? 'btn-warning' : 'btn-success'}`}
            onClick={handlePublish}
            disabled={publishLoading}
          >
            {publishLoading ? (
              <span className="btn-spinner" />
            ) : assessment.is_published ? (
              <FiEyeOff size={16} />
            ) : (
              <FiSend size={16} />
            )}
            {assessment.is_published ? "Unpublish" : "Publish"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/admin/assessment/${id}/edit`)}
          >
            <FiEdit2 size={16} />
            Edit
          </button>
          <button
            className={`btn btn-danger ${deleteConfirm ? "confirm" : ""}`}
            onClick={handleDelete}
          >
            <FiTrash2 size={16} />
            {deleteConfirm ? "Click to Confirm" : "Delete"}
          </button>
        </div>
      </div>

      <div className="view-content">
        <div className="title-section">
          <div className="title-info">
            <h1>{assessment.title}</h1>
            {assessment.job_title && (
              <span className="job-title">{assessment.job_title}</span>
            )}
          </div>
          <div className={`status-badge ${statusInfo.color}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {assessment.description && (
          <div className="description-section">
            <p>{assessment.description}</p>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FiClock size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{assessment.duration_minutes}</span>
              <span className="stat-label">Minutes</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiFileText size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{assessment.assessment_method}</span>
              <span className="stat-label">Method</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiUsers size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{skills.length}</span>
              <span className="stat-label">Skills Required</span>
            </div>
          </div>
        </div>

        <div className="link-section">
          <h3>
            <FiLink size={18} />
            Assessment Link
          </h3>
          <div className="link-box">
            <input type="text" readOnly value={assessmentLink} />
            <button className="btn-copy" onClick={handleCopyLink}>
              <FiCopy size={16} />
              Copy
            </button>
          </div>
          <p className="link-hint">Share this link with candidates to start the assessment</p>
          {assessment.expires_at ? (
            <p className={`link-expiry ${assessment.is_expired ? 'expired' : 'active'}`}>
              <FiClock size={14} />
              <span>
                {assessment.is_expired 
                  ? `Expired on ${new Date(assessment.expires_at).toLocaleString()}`
                  : `Expires on ${new Date(assessment.expires_at).toLocaleString()}`
                }
              </span>
            </p>
          ) : (
            <p className="link-note">
              <FiClock size={14} />
              <span>No expiry date set - link remains active indefinitely</span>
            </p>
          )}
        </div>

        {skills.length > 0 && (
          <div className="skills-section">
            <h3>Required Skills</h3>
            <div className="skills-grid grouped-skills-view">
              {(['basic','intermediate','advance','strong'] as const).map((lvl) => (
                <div key={lvl} className="view-skill-group">
                  <h4 className="view-skill-title">{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</h4>
                  <div className="view-skill-list">
                    {(groupedSkills[lvl] || []).map(({ skill, level }) => (
                      <div key={skill} className="skill-item">
                        <span className="skill-name">{skill}</span>
                        <span className={`skill-level level-${(level || '').toLowerCase()}`}>{level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="settings-section">
          <h3>Assessment Settings</h3>
          <div className="settings-grid">
            <div className={`setting-item ${assessment.is_questionnaire_enabled ? "enabled" : "disabled"}`}>
              <FiFileText size={20} />
              <span>Questionnaire</span>
              <span className="setting-status">
                {assessment.is_questionnaire_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className={`setting-item ${assessment.is_interview_enabled ? "enabled" : "disabled"}`}>
              <FiUsers size={20} />
              <span>Interview</span>
              <span className="setting-status">
                {assessment.is_interview_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className={`setting-item ${assessment.is_active ? "enabled" : "disabled"}`}>
              <FiActivity size={20} />
              <span>Active Status</span>
              <span className="setting-status">
                {assessment.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="metadata-section">
          <div className="metadata-item">
            <FiCalendar size={16} />
            <span>Created: {formatDate(assessment.created_at)}</span>
          </div>
          <div className="metadata-item">
            <FiCalendar size={16} />
            <span>Updated: {formatDate(assessment.updated_at)}</span>
          </div>
          <div className="metadata-item">
            <FiMail size={16} />
            <span>ID: {assessment.assessment_id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentViewContainer;
