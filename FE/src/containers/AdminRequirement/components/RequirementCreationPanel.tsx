"use client";
import RoleSkillPlaceholder from "../../AssessmentSetupContainer/components/RoleSkillPlaceholder";
import { useRequirementContext } from "../RequirementContext";

const RequirementCreationPanel = () => {
  const {
    formData,
    handleFormChange,
    handleSubmit,
    requirements,
    skills,
    setSkills,
    skillLevels,
    setSkillLevels,
    updateFormField,
    clearSkillInputs,
  } = useRequirementContext();

  return (
    <section className="requirement-panel">
        <div className="panel-heading">
          <div>
            <h1>Requirement Creation</h1>
            <p className="subtitle">Outline role details, priority, and skills before publishing.</p>
          </div>
          <div className="status-chip">Live roles: {requirements.length}</div>
        </div>

      <form onSubmit={handleSubmit} className="requirement-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Job Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="Senior Developer"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleFormChange}
              placeholder="Product Engineering"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="level">Experience Level</label>
            <select id="level" name="level" value={formData.level} onChange={handleFormChange}>
              <option value="">Select experience</option>
              <option value="Junior">Junior (0-2 years)</option>
              <option value="Mid">Mid-level (2-5 years)</option>
              <option value="Senior">Senior (5+ years)</option>
              <option value="Lead">Lead / Principal</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
              placeholder="Hybrid / Remote"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" value={formData.priority} onChange={handleFormChange}>
              <option value="">Select priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleFormChange}>
              <option value="">Select status</option>
              <option value="Open">Open</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Role Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            rows={4}
            placeholder="Describe ownership, stack, and outcomes..."
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label>Desired Skills</label>
          <RoleSkillPlaceholder
            role={formData.title}
            setRole={(value) => updateFormField("title", value)}
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
              clearSkillInputs();
            }}
            onRetryAutoFill={() =>
              alert("No extracted text available for retry. Please use an uploaded JD or the Assessment Setup flow to use LLM extraction.")
            }
          />
        </div>

        <button type="submit" className="submit-btn">
          Create Requirement
        </button>
      </form>
    </section>
  );
};

export default RequirementCreationPanel;
