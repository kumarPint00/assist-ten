"use client";
"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "../../hooks/navigation";
import "./AssessmentSetupContainer.scss";
import { useAdminSettings } from "../../hooks/useAdminSettings";

import FileUpload from "./components/FileUpload";
import CandidateInfoSection from "./components/CandidateInfoSection";
import type { CandidateInfoData } from "./components/CandidateInfoSection";
import AvailabilitySelector from "./components/AvailabilitySelector";
import RoleSkillPlaceholder from "./components/RoleSkillPlaceholder";
import AssessmentMethodSelector from "./components/AssessmentMethodSelector";
import AssessmentSetupSubmitButton from "./components/AssessmentSetupSubmitButton";
import AssessmentLinkModal from "./components/AssessmentLinkModal";
import Toast from "../../components/Toast/Toast";
import { isAdmin } from "../../utils/adminUsers";
import { userService } from "../../API/services";
import { uploadService, assessmentService } from "../../API/services";
import { parseResume, getExtractionConfidence } from "../../utils/resumeParser";
import { extractCVData, formatCVDataForAPI } from "../../utils/cvParser";
import { extractCVDataWithLLM } from "../../utils/llmCVExtractor";

interface ValidationError {
  field: string;
  message: string;
}

const AssessmentSetupContainer: React.FC = () => {
  const navigate = useNavigate();
  const { id: assessmentId } = useParams<{ id: string }>();
  const { settings: adminSettings } = useAdminSettings();
  const isEditMode = Boolean(assessmentId);
  
  const [, setUserRole] = useState<string>("admin");
  const [rbacError, setRbacError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [jdFile, setJdFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [reqDoc, setReqDoc] = useState<File | null>(null);
  const [clientDoc, setClientDoc] = useState<File | null>(null);

  const [candidateInfo, setCandidateInfo] = useState<CandidateInfoData>({
    name: "",
    email: "",
    phone: "",
    experience: "",
    currentRole: "",
    location: "",
    linkedIn: "",
    github: "",
    portfolio: "",
    education: "",
  });
  const [emailValid, setEmailValid] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [lastExtractedText, setLastExtractedText] = useState<string | null>(null);
  const [availability, setAvailability] = useState(50);

  const [role, setRole] = useState("");
  const [roleError, setRoleError] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<Record<string, 'strong' | 'advance' | 'intermediate' | 'basic'>>({});
  const [skillsError, setSkillsError] = useState("");
  const [jdSkills, setJdSkills] = useState<string[]>([]);
  const [skillDurations, setSkillDurations] = useState<Record<string, number>>({});
  const [extractedSkillsPreview, setExtractedSkillsPreview] = useState<string[]>([]);

  const [assessmentMethod, setAssessmentMethod] = useState("questionnaire");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const [processLoading, setProcessLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [showAssessmentLinkModal, setShowAssessmentLinkModal] = useState(false);
  const [assessmentLink, setAssessmentLink] = useState("");

  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Debug hook to log candidateInfo changes
  useEffect(() => {
    console.log("[🎯 Form State] Current candidateInfo:", candidateInfo);
  }, [candidateInfo]);

  useEffect(() => {
    const checkRBAC = async () => {
      try {
        const loggedInUser = localStorage.getItem("loggedInUser");
        const authToken = localStorage.getItem("authToken");

        if (!authToken) {
          setRbacError("Authentication failed. Please log in again.");
          return;
        }

        if (!loggedInUser) {
          setRbacError("Unauthorized: Only admins can create assessments");
          return;
        }

        try {
          const user = await userService.getCurrentUser();
          if (!user?.is_admin) {
            setRbacError("Unauthorized: Only admins can create assessments");
            return;
          }
        } catch (e) {
          // fallback to local static list
          if (!isAdmin(loggedInUser)) {
            setRbacError("Unauthorized: Only admins can create assessments");
            return;
          }
        }

        setUserRole("admin");
        setRbacError("");
      } catch (err) {
        console.error("RBAC check failed:", err);
        setRbacError("Authentication failed. Please log in again.");
      }
    };

    checkRBAC();
  }, []);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (!isEditMode || !assessmentId) return;

      setEditLoading(true);
      try {
        const assessment = await assessmentService.getAssessment(assessmentId);
        
        if (assessment.job_title) {
          setRole(assessment.job_title);
        }
        
        if (assessment.required_skills) {
            setSkills(Object.keys(assessment.required_skills));
            setSkillLevels(Object.entries(assessment.required_skills).reduce((acc: Record<string,'strong'|'advance'|'intermediate'|'basic'>, [k,v]) => ({
              ...acc,
              [k]: v === 'advanced' ? 'advance' : v === 'beginner' ? 'basic' : 'intermediate'
            }), {}));
        }
        
        if (assessment.assessment_method) {
          setAssessmentMethod(assessment.assessment_method);
        } else {
          if (assessment.is_interview_enabled) {
            setAssessmentMethod("interview");
          } else if (assessment.is_questionnaire_enabled) {
            setAssessmentMethod("questionnaire");
          }
        }

        if (assessment.description) {
          const nameMatch = assessment.description.match(/candidate\s+(.+?)(?:\s*$|,)/i);
          if (nameMatch) {
            setCandidateInfo(prev => ({ ...prev, name: nameMatch[1].trim() }));
          }
        }

        setToast({ type: "info", message: "Loaded assessment data for editing" });
      } catch (err: any) {
        console.error("Error fetching assessment:", err);
        setToast({ type: "error", message: "Failed to load assessment data" });
      } finally {
        setEditLoading(false);
      }
    };

    fetchAssessmentData();
  }, [isEditMode, assessmentId]);

  useEffect(() => {
    const errors: ValidationError[] = [];

    if (!isEditMode && !cvFile) errors.push({ field: "cv", message: "CV is required" });
    if (!isEditMode && !emailValid) errors.push({ field: "email", message: "Valid email is required" });
    if (!role.trim()) errors.push({ field: "role", message: "Role is required" });
    if (skills.length === 0) errors.push({ field: "skills", message: "At least one skill is required" });

    setValidationErrors(errors);
    setFormValid(errors.length === 0);
  }, [cvFile, emailValid, role, skills, isEditMode]);

  const handleResumeTextExtracted = async (text: string) => {
    console.log("[🚀 CV Extraction] Starting extraction process with text length:", text?.length);
    setLastExtractedText(text);
    
    if (!text || text.trim().length === 0) {
      console.log("[❌ CV Extraction] No text extracted from file");
      setToast({
        type: "error",
        message: "No text could be extracted from the file. Please try a different file.",
      });
      return;
    }

    console.log("[📊 CV Extraction] Extracted text length:", text.length);
    console.log("[📝 CV Extraction] First 500 chars:", text.substring(0, 500));

    // Try LLM-based extraction first (more accurate) if admin defaults allow it
    try {
      console.log("[🤖 LLM Extraction] Attempting LLM-based CV extraction...");
      setProcessLoading(true);
      const useLLMDefault = adminSettings?.useLLMDefault ?? true;
      if (!useLLMDefault) {
        throw new Error('LLM not enabled by default');
      }
      const llmCVData = await extractCVDataWithLLM(text);
      console.log('[🧭 LLM Extraction] Raw response:', llmCVData);
      
      console.log("[✅ LLM Extraction] Successfully extracted CV data:", {
        name: llmCVData.candidate_name,
        email: llmCVData.email,
        phone: llmCVData.phone,
        location: llmCVData.location,
        experience: llmCVData.total_experience_years,
        currentRole: llmCVData.current_role,
        currentCompany: llmCVData.current_company,
        skills: llmCVData.primary_skills?.length || 0,
        confidence: llmCVData.extraction_confidence,
      });

      // Map LLM extracted data to form state
      if (!llmCVData || Object.keys(llmCVData).length === 0) {
        console.warn('[⚠️ LLM Extraction] Empty LLM response, falling back to regex parser');
        throw new Error('Empty LLM response');
      }

      const llmMappedData = {
        name: llmCVData.candidate_name || "",
        email: llmCVData.email || "",
        phone: llmCVData.phone || "",
        experience: llmCVData.total_experience_years || "",
        currentRole: llmCVData.current_role || "",
        location: llmCVData.location || "",
        linkedIn: llmCVData.linkedin_url || "",
        github: llmCVData.github_url || "",
        portfolio: llmCVData.portfolio_url || "",
        education: llmCVData.education?.degree || "",
      };

      console.log("[💾 LLM Mapped Data] Applying to form:", llmMappedData);

      setCandidateInfo((prev) => {
        const updated = {
          ...prev,
          ...llmMappedData,
        };
        console.log('[🧾 CandidateInfo] setCandidateInfo updated:', updated);
        console.log("[📝 Form Update] Updated state with LLM data:", updated);
        return updated;
      });

      // Update email validation
      if (llmCVData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(llmCVData.email)) {
          setEmailValid(true);
          setEmailError("");
        }
      }

      // Update role
      if (llmCVData.current_role && !role) {
        setRole(llmCVData.current_role);
      }

      // Add all extracted skills and set skill confidence levels if supplied by LLM
      const allSkills = [
        ...llmCVData.primary_skills,
        ...llmCVData.secondary_skills,
        ...llmCVData.technical_skills,
        ...llmCVData.soft_skills,
      ];

      if (allSkills.length > 0) {
        setSkills((prevSkills) => {
          // Use Array.from for Set to avoid transpilation issues with downlevelIteration
          const newSkills = Array.from(new Set(prevSkills.concat(allSkills)));
          return newSkills.slice(0, 20); // Limit to 20 skills
        });
        if (llmCVData.classified_skills && llmCVData.classified_skills.length > 0) {
          const newLevels: Record<string, 'strong' | 'advance' | 'intermediate' | 'basic'> = {};
          llmCVData.classified_skills.forEach((s: any) => {
            if (!s || !s.skill_name) return;
            const cat = s.category || 'intermediate';
            const mapped = cat === 'strong' ? 'strong' : cat === 'intermediate' ? 'intermediate' : 'basic';
            newLevels[s.skill_name] = mapped;
          });
          setSkillLevels((prev) => ({ ...prev, ...newLevels }));
        }
      }

      setIsAutoFilled(true);

      // Show success message with confidence score and FREE indicator
      const confidencePercent = Math.round(llmCVData.extraction_confidence * 100);
      setToast({
        type: "success",
        message: `🎉 FREE AI-extracted candidate information (${confidencePercent}% confidence)`,
      });

      return;
    } catch (llmError) {
      console.error("[⚠️ LLM Extraction] Failed, falling back to regex parser:", llmError);
      setToast({
        type: "info",
        message: "Using basic text extraction (LLM unavailable) — auto-fill may be incomplete",
      });
    }
    finally {
      setProcessLoading(false);
    }

    // Fallback to regex-based extraction
    console.log("[🔄 Fallback] Using regex-based extraction...");
    const extractedCVData = extractCVData(text);
    console.log("[✅ CV Parser] Extracted CV data:", {
      fullName: extractedCVData.fullName,
      email: extractedCVData.email,
      phone: extractedCVData.phone,
      location: extractedCVData.location,
      currentRole: extractedCVData.currentRole,
      currentCompany: extractedCVData.currentCompany,
      experience: extractedCVData.experience,
      education: extractedCVData.education,
      linkedinUrl: extractedCVData.linkedinUrl,
      githubUrl: extractedCVData.githubUrl,
      portfolioUrl: extractedCVData.portfolioUrl,
      skills: extractedCVData.skills?.length || 0,
    });

    // Also keep the old parser for backwards compatibility
    const parsedInfo = parseResume(text);
    const confidence = getExtractionConfidence(parsedInfo);

    console.log("[📈 Legacy Parser] Parsed info:", parsedInfo);
    console.log("[📊 Confidence] Score:", confidence);

    // Merge data from both parsers, with CV parser as primary source
    const mergedData = {
      name: extractedCVData.fullName || parsedInfo.name || "",
      email: extractedCVData.email || parsedInfo.email || "",
      phone: extractedCVData.phone || "",
      experience: extractedCVData.experience || parsedInfo.experience || "",
      currentRole: extractedCVData.currentRole || parsedInfo.currentRole || "",
      location: extractedCVData.location || "",
      education: extractedCVData.education || "",
      linkedIn: extractedCVData.linkedinUrl || "",
      github: extractedCVData.githubUrl || "",
      portfolio: extractedCVData.portfolioUrl || "",
    };

    console.log("[🔄 Merged Data] Final values:", mergedData);
    console.log("[🔄 Merged Data] Has any data:", Object.values(mergedData).some(v => v && v.length > 0));

    setCandidateInfo((prev) => {
      const updated = {
        ...prev,
        ...mergedData,
      };
      console.log("[📝 Form Update] Previous state:", prev);
      console.log("[📝 Form Update] Merged data to apply:", mergedData);
      console.log("[📝 Form Update] Final updated state:", updated);
      return updated;
    });

    if (extractedCVData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(extractedCVData.email)) {
        setEmailValid(true);
        setEmailError("");
      }
    }

    if (extractedCVData.currentRole && !role) {
      setRole(extractedCVData.currentRole);
    }

    // Add extracted skills to the skills list
    if (extractedCVData.skills && extractedCVData.skills.length > 0) {
      setSkills((prevSkills) => {
        const newSkills = Array.from(new Set(prevSkills.concat(extractedCVData.skills)));
        return newSkills.slice(0, 20); // Limit to 20 skills
      });
    }

    setIsAutoFilled(true);

    if (confidence >= 50) {
      setToast({
        type: "success",
        message: `Auto-filled candidate information from CV (${confidence}% confidence)`,
      });
    } else if (confidence > 0) {
      setToast({
        type: "info",
        message: `Partially extracted candidate info. Please verify and complete manually.`,
      });
    }
  };

  const handleRetryAutoFill = async () => {
    if (processLoading) {
      return; // already processing
    }

    if (lastExtractedText) {
      console.log('[🔁 Retry Auto-Fill] Re-running LLM extraction on last extracted text');
      setToast({ type: "info", message: "Retrying auto-fill using LLM..." });
      // Re-run LLM extraction on the latest extracted text
      try {
        setProcessLoading(true);
        await handleResumeTextExtracted(lastExtractedText);
      } catch (err) {
        console.error('[⚠️ Retry] LLM auto-fill retry failed:', err);
        setToast({ type: 'error', message: 'Retry failed. We attempted LLM extraction again but it did not succeed.' })
      } finally {
        setProcessLoading(false);
      }
      return;
    }

    // If no extracted text available, try server-side extraction
    if (cvFile) {
      console.log('[🔁 Retry Auto-Fill] Falling back to server-side extraction (no client text)');
      setToast({ type: "info", message: "Retrying server-side extraction and auto-fill..." });
      await handleProcessFile();
      return;
    }

    setToast({ type: "error", message: "No CV file available to retry auto-fill." });
  };

  const handleProcessFile = async () => {
    if (!cvFile) {
      setToast({ type: "error", message: "Please select a CV first" });
      return;
    }

    setProcessLoading(true);

    try {
      const useLLMDefault = adminSettings?.useLLMDefault ?? true;
      const res = await uploadService.extractSkills(cvFile, jdFile || undefined, reqDoc || undefined, clientDoc || undefined, useLLMDefault);
      console.log('[🧾 Extract Skills] Server response:', res);

      const extractedSkillsList = res.skills || (res as any).extracted_skills || [];
      setExtractedSkillsPreview(extractedSkillsList.map((s:any) => typeof s === 'string' ? s : (s.skill_name || s)));
      const skillNames = extractedSkillsList.map((s: any) => typeof s === 'string' ? s : (s.skill_name || s));
      
      const extractedRole = res.role || (res as any).extracted_role || "";

      if (extractedRole) {
        setRole(extractedRole);
        setRoleError("");
      }
      if (skillNames.length > 0) {
        setSkills(skillNames);
        // Map server led proficiency to UI levels
        const levelMap: Record<string, 'strong' | 'advance' | 'intermediate' | 'basic'> = {};
        const profToLevel = (prof: string) => prof === 'advanced' ? 'advance' : prof === 'intermediate' ? 'intermediate' : prof === 'beginner' ? 'basic' : 'intermediate';
        // If server returns objects
        if (Array.isArray(res.classified_skills) && res.classified_skills.length > 0) {
          res.classified_skills.forEach((s: any) => {
            if (!s || !s.skill_name) return;
            levelMap[s.skill_name] = profToLevel(s.proficiency_level || s.category || 'intermediate');
          });
        }
        setSkillLevels((prev) => ({ ...prev, ...levelMap }));
        setSkillsError("");
      }

      const jdSkillsList = (res as any).jd_skills || [];
      if (jdSkillsList.length > 0) {
        setJdSkills(jdSkillsList.map((s: any) => typeof s === 'string' ? s : (s.skill_name || s)));
      }

      const durations = (res as any).skill_durations || {};
      if (Object.keys(durations).length > 0) {
        setSkillDurations(durations);
      }

      setToast({ type: "success", message: `Extracted ${skillNames.length} skills from documents!` });
      // If candidate info wasn't auto-filled via client extraction, try LLM extraction using server-side preview text
      try {
        const previewText = res.documents?.[0]?.extraction_preview || "";
        if (previewText) setLastExtractedText(previewText);
        if ((!candidateInfo.name || !candidateInfo.email) && previewText) {
          console.log('[ℹ️ Fallback] Trying server-side extracted text for LLM CV extraction');
          const llmCVData = await extractCVDataWithLLM(previewText);
          if (llmCVData && Object.keys(llmCVData).length > 0) {
            const mappedData = {
              name: llmCVData.candidate_name || candidateInfo.name,
              email: llmCVData.email || candidateInfo.email,
              phone: llmCVData.phone || candidateInfo.phone,
              experience: llmCVData.total_experience_years || candidateInfo.experience,
              currentRole: llmCVData.current_role || candidateInfo.currentRole,
              location: llmCVData.location || candidateInfo.location,
              linkedIn: llmCVData.linkedin_url || candidateInfo.linkedIn,
              github: llmCVData.github_url || candidateInfo.github,
              portfolio: llmCVData.portfolio_url || candidateInfo.portfolio,
              education: llmCVData.education?.degree || candidateInfo.education,
            };

            setCandidateInfo((prev) => ({ ...prev, ...mappedData }));

            if (llmCVData.current_role && !role) setRole(llmCVData.current_role);

            if (llmCVData.primary_skills && llmCVData.primary_skills.length > 0) {
              // Merge extracted skills with existing skills from admin endpoint
              const merged = Array.from(new Set([...(skillNames || []), ...(llmCVData.primary_skills || [])]));
              setSkills(merged);
            }
            if (llmCVData.classified_skills && llmCVData.classified_skills.length > 0) {
              const newLevels: Record<string, 'strong'|'intermediate'|'basic'> = {};
              llmCVData.classified_skills.forEach((s: any) => {
                if (!s || !s.skill_name) return;
                const mapped = s.category && s.category.toLowerCase() === 'strong' ? 'strong' : s.category && s.category.toLowerCase() === 'intermediate' ? 'intermediate' : 'basic';
                newLevels[s.skill_name] = mapped;
              });
              setSkillLevels((prev) => ({ ...prev, ...newLevels }));
            }
            setIsAutoFilled(true);
            setToast({ type: "success", message: "Candidate info auto-filled from server-side extraction" });
          }
        }
      } catch (fallbackErr) {
        console.warn('[⚠️ Fallback] Server-side LLM CV extraction failed:', fallbackErr);
      }
    } catch (err: any) {
      console.error("Error processing resume:", err);
      const errorMessage = err.response?.data?.detail || "Failed to process resume. Please try again.";
      setToast({ type: "error", message: errorMessage });
    } finally {
      setProcessLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formValid) {
      setToast({ type: "error", message: "Please complete all required fields" });
      return;
    }

    setSubmitLoading(true);

    try {
      const assessmentPayload: any = {
        title: `Assessment for ${role}`,
        description: `Assessment created for candidate ${candidateInfo.name || candidateInfo.email}`,
        job_title: role.trim(),
        required_skills: skills.reduce((acc, skill) => ({
          ...acc,
          [skill]: skillLevels[skill] === 'basic' ? 'beginner' : skillLevels[skill] === 'intermediate' ? 'intermediate' : 'advanced'
        }), {}),
        required_roles: [role.trim()],
        duration_minutes: 30,
        is_questionnaire_enabled: assessmentMethod === "questionnaire",
        is_interview_enabled: assessmentMethod === "interview",
        candidate_info: {
          name: candidateInfo.name,
          email: candidateInfo.email,
          experience: candidateInfo.experience,
          current_role: candidateInfo.currentRole,
        },
      };

      if (expiresAt) {
        assessmentPayload.expires_at = new Date(expiresAt).toISOString();
      }

      const response = isEditMode 
        ? await assessmentService.updateAssessment(assessmentId!, assessmentPayload)
        : await assessmentService.createAssessment(assessmentPayload);
      
      const resultAssessmentId = response?.assessment_id;
      const generatedLink = `${window.location.origin}/candidate-assessment/${resultAssessmentId}`;

      setAssessmentLink(generatedLink);
      setShowAssessmentLinkModal(true);

      setToast({ type: "success", message: isEditMode ? "Assessment updated successfully!" : "Assessment created successfully!" });
    } catch (err: any) {
      console.error("Error submitting assessment:", err);
      const errorMessage = err.response?.data?.detail || "Failed to create assessment. Please try again.";
      setToast({ type: "error", message: errorMessage });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (rbacError) {
    return (
      <div className="assessment-page error-page">
        <div className="rbac-error">
          <h2>Access Denied</h2>
          <p>{rbacError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-page">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <header className="page-header">
        <h1>{isEditMode ? "Edit Assessment" : "Assessment Setup"}</h1>
        <p className="subtitle">
          {isEditMode 
            ? "Update assessment details, role, skills, and settings."
            : "Upload documents, review role & skills, and generate assessment link."
          }
        </p>
      </header>

      {editLoading && (
        <div className="edit-loading">
          <div className="spinner" />
          <p>Loading assessment data...</p>
        </div>
      )}

      <section className="card upload-card">
        <div className="card-header">
          <h2>Upload Documents</h2>
          <p className="hint">Candidate CV is required. Other documents are optional. Candidate info will be auto-filled from CV.</p>
        </div>

        <div className="upload-grid">
          <FileUpload label="Job Description (Optional)" onFileSelect={setJdFile} />
          <FileUpload 
            label="Candidate CV *" 
            onFileSelect={setCvFile} 
            onTextExtracted={handleResumeTextExtracted}
            isRequired 
          />
          <FileUpload label="Requirement Doc (Optional)" onFileSelect={setReqDoc} />
          <FileUpload label="Client Portfolio (Optional)" onFileSelect={setClientDoc} />
        </div>

        <div className="card-actions">
          <button
            className="btn primary"
            onClick={handleProcessFile}
            disabled={!cvFile || processLoading}
            aria-label="Extract role and skills from uploaded documents"
          >
            {processLoading ? "Processing..." : "Extract Role & Skills"}
          </button>
          <button
            className="btn secondary"
            onClick={handleRetryAutoFill}
            disabled={processLoading || (!cvFile && !lastExtractedText)}
            title="Retry auto-fill using LLM or server-side extraction"
            aria-label="Retry auto-fill using LLM or server-side extraction"
          >
            Retry Auto-Fill
          </button>
        </div>
      </section>

      <section className="card details-card">
        <div className="card-header">
          <h2>Assessment Details</h2>
        </div>

          <RoleSkillPlaceholder
          role={role}
          setRole={setRole}
          roleError={roleError}
          setRoleError={setRoleError}
            skills={skills}
            skillLevels={skillLevels}
            extractedSkills={extractedSkillsPreview}
          setSkills={setSkills}
          skillsError={skillsError}
          setSkillsError={setSkillsError}
          jdSkills={jdSkills}
          skillDurations={skillDurations}
          onRetryAutoFill={handleRetryAutoFill}
        />
      </section>

      <section className="card candidate-card">
        <div className="card-header">
          <h2>Candidate Information</h2>
          <p className="hint">Auto-filled from resume. Edit if needed.</p>
        </div>

        <CandidateInfoSection
          candidateInfo={candidateInfo}
          setCandidateInfo={setCandidateInfo}
          emailValid={emailValid}
          setEmailValid={setEmailValid}
          emailError={emailError}
          setEmailError={setEmailError}
          isAutoFilled={isAutoFilled}
        />

        <div className="field" style={{ marginTop: "16px" }}>
          <AvailabilitySelector value={availability} setValue={setAvailability} />
        </div>
      </section>

      <section className="card method-card">
        <div className="card-header">
          <h2>Assessment Method</h2>
          <p className="hint">Select how candidates will be assessed</p>
        </div>

        <AssessmentMethodSelector
          method={assessmentMethod}
          setMethod={setAssessmentMethod}
        />
      </section>

      <section className="card expiry-card">
        <div className="card-header">
          <h2>Assessment Expiry</h2>
          <p className="hint">Set when this assessment link should expire (optional)</p>
        </div>

        <div className="expiry-field">
          <label htmlFor="expiresAt">Expiry Date & Time</label>
          <input
            type="datetime-local"
            id="expiresAt"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="expiry-input"
          />
          {expiresAt && (
            <p className="expiry-preview">
              Link will expire on: {new Date(expiresAt).toLocaleString()}
            </p>
          )}
          {!expiresAt && (
            <p className="expiry-note">Leave empty for no expiration</p>
          )}
        </div>
      </section>

      {validationErrors.length > 0 && (
        <div className="validation-summary">
          <div className="validation-header">
            <h3>⚠️ Please complete the following:</h3>
          </div>
          <ul className="validation-list">
            {validationErrors.map((error, idx) => (
              <li key={idx}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="footer-actions">
        <AssessmentSetupSubmitButton
          disabled={!formValid || submitLoading}
          loading={submitLoading}
          onClick={handleSubmit}
          validationCount={validationErrors.length}
          label={isEditMode ? "Update Assessment" : "Set Assessment"}
          loadingLabel={isEditMode ? "Updating Assessment..." : "Creating Assessment..."}
        />
      </div>

      <AssessmentLinkModal
        open={showAssessmentLinkModal}
        link={assessmentLink}
        email={candidateInfo.email}
        onClose={() => {
          setShowAssessmentLinkModal(false);
          navigate("/admin/dashboard");
        }}
      />
    </div>
  );
};

export default AssessmentSetupContainer;