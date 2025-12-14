import React from "react";
import { FiUser, FiMail, FiBriefcase, FiClock, FiMapPin, FiBook, FiLink, FiGithub } from "react-icons/fi";
import { SiLinkedin } from "react-icons/si";
import "./CandidateInfoSection.scss";

export interface CandidateInfoData {
  name: string;
  email: string;
  phone: string;
  experience: string;
  currentRole: string;
  location: string;
  linkedIn: string;
  github: string;
  portfolio: string;
  education: string;
}

interface CandidateInfoSectionProps {
  candidateInfo: CandidateInfoData;
  setCandidateInfo: (info: CandidateInfoData) => void;
  emailValid: boolean;
  setEmailValid: (valid: boolean) => void;
  emailError: string;
  setEmailError: (error: string) => void;
  isAutoFilled?: boolean;
}

const CandidateInfoSection: React.FC<CandidateInfoSectionProps> = ({
  candidateInfo,
  setCandidateInfo,
  emailValid,
  setEmailValid,
  emailError,
  setEmailError,
  isAutoFilled = false,
}) => {
  // Debug: Log when candidateInfo changes
  React.useEffect(() => {
    if (candidateInfo.email || candidateInfo.name || candidateInfo.phone) {
      console.log("[👁️ CandidateInfoSection] Received data:", candidateInfo);
    }
  }, [candidateInfo]);
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setCandidateInfo({ ...candidateInfo, email: value });
    if (!value.trim()) {
      setEmailValid(false);
      setEmailError("Email is required");
    } else if (!validateEmail(value)) {
      setEmailValid(false);
      setEmailError("Please enter a valid email");
    } else {
      setEmailValid(true);
      setEmailError("");
    }
  };

  const handleChange = (field: keyof CandidateInfoData, value: string) => {
    if (field === "email") {
      handleEmailChange(value);
    } else {
      setCandidateInfo({ ...candidateInfo, [field]: value });
    }
  };

  return (
    <div className="candidate-info-section">
      {isAutoFilled && (
        <div className="auto-fill-badge">
          <span className="badge-icon">✨</span>
          <span>Auto-filled from resume. Please verify and correct if needed.</span>
        </div>
      )}

      <div className="info-grid">
        <div className="info-field">
          <label>
            <FiUser className="field-icon" />
            Candidate Name
          </label>
          <input
            type="text"
            value={candidateInfo.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter candidate name"
            className={`${candidateInfo.name ? "has-value" : ""} ${isAutoFilled && candidateInfo.name ? "auto-filled" : ""}`}
            title={isAutoFilled && candidateInfo.name ? "Auto-filled from CV" : ""}
          />
        </div>

        <div className="info-field">
          <label>
            <FiMail className="field-icon" />
            Email Address *
          </label>
          <input
            type="email"
            value={candidateInfo.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="candidate@email.com"
            className={`${emailError ? "error" : ""} ${emailValid ? "valid" : ""} ${isAutoFilled && candidateInfo.email ? "auto-filled" : ""}`}
            title={isAutoFilled && candidateInfo.email ? "Auto-filled from CV" : ""}
          />
          {emailError && <span className="error-text">{emailError}</span>}
        </div>

        <div className="info-field">
          <label>
            <FiBriefcase className="field-icon" />
            Current Role
          </label>
          <input
            type="text"
            value={candidateInfo.currentRole}
            onChange={(e) => handleChange("currentRole", e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className={isAutoFilled && candidateInfo.currentRole ? "auto-filled" : ""}
            title={isAutoFilled && candidateInfo.currentRole ? "Auto-filled from CV" : ""}
          />
        </div>

        <div className="info-field">
          <label>
            <FiClock className="field-icon" />
            Experience
          </label>
          <input
            type="text"
            value={candidateInfo.experience}
            onChange={(e) => handleChange("experience", e.target.value)}
            placeholder="e.g., 5 years"
          />
        </div>

        <div className="info-field">
          <label>
            📱 Phone Number
          </label>
          <input
            type="tel"
            value={candidateInfo.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="e.g., +1 (555) 123-4567"
          />
        </div>

        <div className="info-field">
          <label>
            <FiMapPin className="field-icon" />
            Location
          </label>
          <input
            type="text"
            value={candidateInfo.location}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="e.g., San Francisco, CA"
          />
        </div>

        <div className="info-field">
          <label>
            <FiBook className="field-icon" />
            Education
          </label>
          <input
            type="text"
            value={candidateInfo.education}
            onChange={(e) => handleChange("education", e.target.value)}
            placeholder="e.g., B.S. Computer Science"
          />
        </div>

        <div className="info-field">
          <label>
            <SiLinkedin className="field-icon" style={{ color: '#0077B5' }} />
            LinkedIn Profile
          </label>
          <input
            type="url"
            value={candidateInfo.linkedIn}
            onChange={(e) => handleChange("linkedIn", e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div className="info-field">
          <label>
            <FiGithub className="field-icon" />
            GitHub Profile
          </label>
          <input
            type="url"
            value={candidateInfo.github}
            onChange={(e) => handleChange("github", e.target.value)}
            placeholder="https://github.com/yourprofile"
          />
        </div>

        <div className="info-field">
          <label>
            <FiLink className="field-icon" />
            Portfolio Website
          </label>
          <input
            type="url"
            value={candidateInfo.portfolio}
            onChange={(e) => handleChange("portfolio", e.target.value)}
            placeholder="https://yourportfolio.com"
          />
        </div>
      </div>
    </div>
  );
};

export default CandidateInfoSection;
