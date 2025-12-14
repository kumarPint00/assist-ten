"use client";
import { useRequirementContext } from "../RequirementContext";

const RequirementSummaryPanel = () => {
  const { requirements, priorityCounts } = useRequirementContext();

  return (
    <section className="requirement-panel summary-panel">
      <div className="panel-heading">
        <div>
          <h2>Live Requirements</h2>
          <p className="subtitle">Track priorities and statuses for every open role.</p>
        </div>
        <div className="status-chip muted">{requirements.length} tracked</div>
      </div>

      <div className="requirement-stats">
        <div>
          <span>High Priority</span>
          <strong>{priorityCounts.High || 0}</strong>
        </div>
        <div>
          <span>Medium Priority</span>
          <strong>{priorityCounts.Medium || 0}</strong>
        </div>
        <div>
          <span>Low Priority</span>
          <strong>{priorityCounts.Low || 0}</strong>
        </div>
      </div>

      <div className="requirement-list">
        {requirements.map((requirement) => (
          <article key={requirement.id} className="requirement-card">
            <div className="card-header">
              <div>
                <h3>{requirement.title}</h3>
                <p>{requirement.department}</p>
              </div>
              <span className={`status-pill ${requirement.status.toLowerCase()}`}>{requirement.status}</span>
            </div>
            <p className="description">{requirement.description}</p>
            <div className="card-meta">
              <span>{requirement.location}</span>
              <span>{requirement.level}</span>
              <span>Priority {requirement.priority}</span>
            </div>
            <div className="skill-row">
              {requirement.skills.map((skill) => (
                <span key={`${requirement.id}-${skill}`} className="skill-pill">
                  {skill}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default RequirementSummaryPanel;
