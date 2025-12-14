"use client";
import { RequirementRecord, useRequirementContext } from "../RequirementContext";

const RequirementManagementPanel = () => {
  const {
    filteredManagementRequirements,
    managementFilters,
    handleFilterChange,
    requirementStatuses,
    handleStatusChange,
    handleDuplicateRequirement,
  } = useRequirementContext();

  return (
    <section className="requirement-panel management-panel">
      <div className="panel-heading">
        <div>
          <h2>Requirement management</h2>
          <p className="subtitle">Filter, update, and duplicate role briefs without leaving the dashboard.</p>
        </div>
        <div className="status-chip muted">{filteredManagementRequirements.length} visible</div>
      </div>

      <div className="management-controls">
        <div className="filter-group compact">
          <label>Status</label>
          <select value={managementFilters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
            <option value="All">Any</option>
            {requirementStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group compact">
          <label>Priority</label>
          <select value={managementFilters.priority} onChange={(e) => handleFilterChange("priority", e.target.value)}>
            <option value="All">Any</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group compact search">
          <label>Search roles</label>
          <input
            type="text"
            placeholder="Search title, department, or description"
            value={managementFilters.query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
          />
        </div>
      </div>

      <div className="management-table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Department</th>
              <th>Level</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Skills</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredManagementRequirements.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={7}>No requirements match the filters.</td>
              </tr>
            ) : (
              filteredManagementRequirements.map((requirement) => (
                <tr key={requirement.id}>
                  <td>
                    <strong>{requirement.title}</strong>
                    <span className="tiny-text">{requirement.id}</span>
                  </td>
                  <td>{requirement.department}</td>
                  <td>{requirement.level}</td>
                  <td>
                    <span className="priority-pill">{requirement.priority}</span>
                  </td>
                  <td>
                    <select
                      value={requirement.status}
                      onChange={(event) => handleStatusChange(requirement.id, event.target.value as RequirementRecord["status"])}
                    >
                      {requirementStatuses.map((status) => (
                        <option key={`${requirement.id}-${status}`} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className="skill-preview">
                      {requirement.skills.length ? requirement.skills.join(", ") : "No skills"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() =>
                        handleStatusChange(requirement.id, requirement.status === "Closed" ? "Open" : "Closed")
                      }
                    >
                      {requirement.status === "Closed" ? "Reopen" : "Mark closed"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => handleDuplicateRequirement(requirement)}
                    >
                      Duplicate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default RequirementManagementPanel;
