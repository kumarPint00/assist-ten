"use client";
import React, { useState, useMemo } from "react";
import { FiX, FiCheck, FiAlertCircle, FiStar } from "react-icons/fi";
import "./RoleSkillPlaceholder.scss";

interface Props {
  role: string;
  setRole: (val: string) => void;
  roleError?: string;
  setRoleError?: (err: string) => void;
  skills: string[];
  setSkills: (val: string[]) => void;
  skillsError?: string;
  setSkillsError?: (err: string) => void;
  extractedRole?: string;
  extractedSkills?: string[];
  jdSkills?: string[];
  skillDurations?: Record<string, number>;
  onClearExtraction?: () => void;
  onRetryAutoFill?: () => void;
  skillLevels?: Record<string, 'strong' | 'advance' | 'intermediate' | 'basic'>;
}

const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "FastAPI",
  "SQLAlchemy",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "REST API",
  "Machine Learning",
  "Data Science",
  "AI",
  "Agentic AI",
  "LangChain",
  "GPT",
  "Groq",
];

const RoleSkillPlaceholder: React.FC<Props> = ({
  role,
  setRole,
  roleError,
  setRoleError,
  skills,
  setSkills,
  skillsError,
  setSkillsError,
  extractedRole,
  extractedSkills,
  jdSkills = [],
  skillDurations = {},
  onClearExtraction: _onClearExtraction,
  onRetryAutoFill,
  skillLevels = {},
}) => {
  const [tempSkill, setTempSkill] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  // Note: show more/less toggles have been removed — grouped sections display all skills

  const sortedSkills = useMemo(() => {
    return skills
      .map(skill => ({
        name: skill,
        duration: skillDurations[skill.toLowerCase()] || 0,
        isMatched: jdSkills.some(jd => 
          jd.toLowerCase() === skill.toLowerCase() || 
          skill.toLowerCase().includes(jd.toLowerCase()) ||
          jd.toLowerCase().includes(skill.toLowerCase())
        )
      }))
      .sort((a, b) => {
        if (a.isMatched && !b.isMatched) return -1;
        if (!a.isMatched && b.isMatched) return 1;
        return b.duration - a.duration;
      });
  }, [skills, jdSkills, skillDurations]);

  // All skills are rendered grouped by level; no collapsed/expanded view.

  // Group skills by level based on skillLevels prop
  const levelGroups = useMemo(() => {
    const groups: Record<string, { name: string, duration: number, isMatched: boolean }[]> = {
      basic: [],
      intermediate: [],
      advance: [],
      strong: [],
    };
    skills.forEach(s => {
      const level = (skillLevels && skillLevels[s]) || 'intermediate';
      const skillData = sortedSkills.find(d => d.name === s) || { name: s, duration: skillDurations[s.toLowerCase()] || 0, isMatched: jdSkills.some(jd => jd.toLowerCase() === s.toLowerCase()) };
      groups[level].push(skillData as any);
    });
    return groups;
  }, [skills, skillLevels, sortedSkills, skillDurations, jdSkills]);
  // no collapse/expand state — everything is always visible
  const matchedCount = sortedSkills.filter(s => s.isMatched).length;

  const handleRoleChange = (value: string) => {
    setRole(value);
    if (value.trim()) {
      setRoleError?.("");
    }
  };

  const handleSkillInput = (value: string) => {
    setTempSkill(value);
    if (value.trim().length > 0) {
      const filtered = SKILL_SUGGESTIONS.filter(
        (skill) =>
          skill.toLowerCase().includes(value.toLowerCase()) &&
          !skills.includes(skill)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addSkill = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed || skills.includes(trimmed)) return;

    setSkills([...skills, trimmed]);
    setTempSkill("");
    setShowSuggestions(false);
    setSkillsError?.("");
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(tempSkill);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const removeSkill = (index: number) => {
    if (index < 0 || index >= skills.length) return;
    const updated = [...skills];
    updated.splice(index, 1);
    setSkills(updated);
  };

  const useExtractedRole = () => {
    if (extractedRole) {
      setRole(extractedRole);
      setRoleError?.("");
    }
  };

  const useExtractedSkills = () => {
    if (extractedSkills && extractedSkills.length > 0) {
      const newSkills = [
        ...skills,
        ...extractedSkills.filter((s) => !skills.includes(s)),
      ];
      setSkills(newSkills);
      setSkillsError?.("");
    }
  };

  return (
    <div className="role-skill-wrapper">
      {/* ROLE SECTION */}
      <div className={`form-group ${roleError ? "error" : ""}`}>
        <div className="group-header">
          <label className="form-label">
            Role *
            {extractedRole && extractedRole !== role && (
              <span className="extraction-badge">auto-extracted</span>
            )}
          </label>
          {extractedRole && extractedRole !== role && (
            <button
              type="button"
              className="use-extraction-btn"
              onClick={useExtractedRole}
              title="Use extracted role"
            >
              Use suggestion
            </button>
          )}
        </div>

        <div className="role-input-container">
          <input
            type="text"
            className="form-input"
            value={role}
            placeholder="Enter or edit candidate role"
            onChange={(e) => handleRoleChange(e.target.value)}
          />
          {role && <FiCheck size={18} className="check-icon" />}
        </div>

        {roleError && (
          <div className="error-message">
            <FiAlertCircle size={14} />
            <span>{roleError}</span>
          </div>
        )}
      </div>

      {/* SKILLS SECTION */}
      <div className={`form-group ${skillsError ? "error" : ""}`}>
        <div className="group-header">
          <label className="form-label">
            Skills * ({skills.length})
            {extractedSkills && extractedSkills.length > 0 && (
              <span className="extraction-badge">
                {extractedSkills.length} extracted
              </span>
            )}
          </label>
          {extractedSkills && extractedSkills.length > 0 && (
            <button
              type="button"
              className="use-extraction-btn"
              onClick={useExtractedSkills}
              title="Add extracted skills"
            >
              Add all
            </button>
          )}
        </div>

        {/* Skill Input with Suggestions */}
        <div className="skill-input-container">
          <input
            type="text"
            className="form-input"
            placeholder="Type skill name or press Ctrl+Space for suggestions"
            value={tempSkill}
            onChange={(e) => handleSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            onFocus={() => tempSkill && setShowSuggestions(true)}
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {filteredSuggestions.map((skill) => (
                <div
                  key={skill}
                  className="suggestion-item"
                  onClick={() => addSkill(skill)}
                >
                  {skill}
                </div>
              ))}
            </div>
          )}
        </div>

        {jdSkills.length > 0 && matchedCount > 0 && (
          <div className="jd-match-summary">
            <FiStar className="match-icon" />
            <span>{matchedCount} of {skills.length} skills match JD requirements</span>
          </div>
        )}

        <div className="skills-list grouped-skills">
          {/* Grouped skill sections */}
          {['basic', 'intermediate', 'advance', 'strong'].map((lvl) => (
            <div key={lvl} className={`skill-group skill-group-${lvl}`}>
              <h4 className="skill-group-title">{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</h4>
              <div className="skill-group-list">
                {(levelGroups as any)[lvl].map((skillData: any, index: number) => (
                  <div key={`${lvl}-${index}`} className={`skill-chip level-${lvl} ${skillData.isMatched ? 'matched' : ''}`}>
                    {skillData.isMatched && <FiStar className="match-star" size={12} />}
                    <span className="skill-name">{skillData.name}</span>
                    {skillData.duration > 0 && <span className="skill-duration">{skillData.duration}+ yrs</span>}
                    {extractedSkills?.includes(skillData.name) && !skillData.isMatched && <span className="source-label">auto</span>}
                    <button type="button" className="remove-skill" onClick={() => removeSkill(skills.indexOf(skillData.name))} aria-label={`Remove ${skillData.name}`} title={`Remove ${skillData.name}`}>
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* no collapsed section — all skills shown in the grouped view above */}

        {/* Extracted Skills Preview (if not used yet) */}
        {extractedSkills && extractedSkills.length > 0 && skills.length === 0 && (
          <div className="extracted-preview">
            <p className="preview-label">📋 Suggestions from your documents:</p>
            <div className="preview-skills">
              {extractedSkills.slice(0, 5).map((skill) => (
                <span key={skill} className="preview-chip">
                  {skill}
                </span>
              ))}
              {extractedSkills.length > 5 && (
                <span className="preview-chip more">+{extractedSkills.length - 5}</span>
              )}
            </div>
          </div>
        )}

        {skillsError && (
          <div className="error-message">
            <FiAlertCircle size={14} />
            <span>{skillsError}</span>
          </div>
        )}
      </div>

      {/* Info Box */}
      {(extractedRole || extractedSkills?.length) && (
        <div className="extraction-info">
          <p>💡 <strong>Tip:</strong> You can customize the auto-extracted suggestions or keep them as-is. Click &quot;Use suggestion&quot; or &quot;Add all&quot; to accept.</p>
          {onRetryAutoFill && (
            <button className="use-extraction-btn retry-btn" onClick={onRetryAutoFill} title="Retry auto-fill using LLM">
              Retry Auto-Fill
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleSkillPlaceholder;