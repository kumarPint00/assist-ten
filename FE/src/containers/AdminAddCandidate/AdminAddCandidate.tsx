"use client";
import React, { useState } from "react";
import "./AdminAddCandidate.scss";
import RoleSkillPlaceholder from "../AssessmentSetupContainer/components/RoleSkillPlaceholder";
import CandidateEmailComposer from "../../components/admin/CandidateEmailComposer";

interface CandidateRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  experience: string;
  location: string;
  availability: string;
  status: string;
  skills: string[];
  notes: string;
}

const AdminAddCandidate: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    experience: "",
    location: "",
    availability: "",
    status: "",
    notes: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<Record<string, "strong" | "advance" | "intermediate" | "basic">>({});
  const [candidates, setCandidates] = useState<CandidateRecord[]>([
    {
      id: "C-2025-001",
      name: "Maya Patel",
      email: "maya.patel@assist.com",
      role: "Product Developer",
      experience: "Senior (6y)",
      location: "Bengaluru",
      availability: "Dec 20, 2025",
      status: "Interviewing",
      skills: ["React", "Node.js", "System Design"],
      notes: "Prefers hybrid work. Strong backend foundation.",
    },
    {
      id: "C-2025-002",
      name: "Samuel Ortiz",
      email: "samuel.ortiz@assist.com",
      role: "UX Designer",
      experience: "Mid (3y)",
      location: "Remote",
      availability: "Jan 06, 2026",
      status: "Screening",
      skills: ["Figma", "Accessibility QA"],
      notes: "Portfolio includes fintech workflows.",
    },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().getTime();
    const newCandidate: CandidateRecord = {
      id: `C-${timestamp.toString().slice(-5)}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role || "General",
      experience: formData.experience || "Not specified",
      location: formData.location || "Remote",
      availability: formData.availability ? new Date(formData.availability).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "ASAP",
      status: formData.status || "New",
      skills,
      notes: formData.notes.trim() || "",
    };
    setCandidates((prev) => [newCandidate, ...prev]);
    alert("Candidate added successfully!");
    setFormData({
      name: "",
      email: "",
      role: "",
      experience: "",
      location: "",
      availability: "",
      status: "",
      notes: "",
    });
    setSkills([]);
    setSkillLevels({});
  };

  return (
    <div className="admin-add-candidate">
      <div className="candidate-wrapper">
        <section className="candidate-panel">
          <div className="panel-heading">
            <div>
              <h1>Add Candidate</h1>
              <p className="subtitle">Capture detailed candidate info before routing them to assessments.</p>
            </div>
            <div className="status-chip">{candidates.length} profiles</div>
          </div>

          <form onSubmit={handleSubmit} className="candidate-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Candidate Name</label>
                <input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input id="email" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Target Role</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} required>
                  <option value="">Select a role</option>
                  <option value="Product Developer">Product Developer</option>
                  <option value="UX Designer">UX Designer</option>
                  <option value="Engineering Manager">Engineering Manager</option>
                  <option value="Data Analyst">Data Analyst</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="experience">Experience</label>
                <select id="experience" name="experience" value={formData.experience} onChange={handleChange}>
                  <option value="">Select experience</option>
                  <option value="Junior (0-2 years)">Junior (0-2 years)</option>
                  <option value="Mid (2-5 years)">Mid (2-5 years)</option>
                  <option value="Senior (5+ years)">Senior (5+ years)</option>
                  <option value="Lead (8+ years)">Lead (8+ years)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location / Timezone</label>
                <input id="location" name="location" placeholder="Bengaluru / IST" value={formData.location} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="availability">Availability</label>
                <input id="availability" name="availability" type="date" value={formData.availability} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Current Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange}>
                  <option value="">Select status</option>
                  <option value="New">New</option>
                  <option value="Screening">Screening</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer">Offer</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Context for interviewers"
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="form-group">
              <label>Candidate Skills</label>
              <RoleSkillPlaceholder
                role={formData.role}
                setRole={(val) => setFormData((prev) => ({ ...prev, role: val }))}
                roleError=""
                setRoleError={() => {}}
                skills={skills}
                setSkills={setSkills}
                skillsError=""
                setSkillsError={() => {}}
                jdSkills={[]}
                skillDurations={{}}
                skillLevels={skillLevels}
                onClearExtraction={() => {
                  setSkills([]);
                  setSkillLevels({});
                }}
                onRetryAutoFill={() =>
                  alert("No extracted text available for retry. Please upload a file or use the Assessment Setup page.")
                }
              />
            </div>

            <button type="submit" className="submit-btn">
              Add Candidate
            </button>
          </form>
        </section>

        <section className="candidate-panel summary-panel">
          <div className="panel-heading">
            <div>
              <h2>Candidate Roster</h2>
              <p className="subtitle">Recent additions and status overview.</p>
            </div>
            <div className="status-chip muted">Updated live</div>
          </div>

          <div className="candidate-stats">
            <div>
              <span>Total Profiles</span>
              <strong>{candidates.length}</strong>
            </div>
            <div>
              <span>Interviewing</span>
              <strong>{candidates.filter((c) => c.status === "Interviewing").length}</strong>
            </div>
            <div>
              <span>Screening</span>
              <strong>{candidates.filter((c) => c.status === "Screening").length}</strong>
            </div>
          </div>

          <div className="candidate-list">
            {candidates.map((candidate) => (
              <article key={candidate.id} className="candidate-card">
                <div className="card-header">
                  <div>
                    <h3>{candidate.name}</h3>
                    <p>{candidate.role}</p>
                  </div>
                  <span className={`status-pill ${candidate.status.toLowerCase()}`}>{candidate.status}</span>
                </div>
                <div className="card-meta">
                  <span>{candidate.email}</span>
                  <span>{candidate.experience}</span>
                  <span>{candidate.location}</span>
                </div>
                <div className="skill-row">
                  {candidate.skills.map((skill) => (
                    <span key={skill} className="skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="notes">{candidate.notes}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <div className="candidate-email-section">
        <CandidateEmailComposer />
      </div>
    </div>
  );
};

export default AdminAddCandidate;
