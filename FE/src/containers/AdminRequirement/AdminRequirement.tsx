"use client";
import React, { useState } from "react";
import "./AdminRequirement.scss";

const AdminRequirement = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: "",
    level: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Create Requirement:", formData);
    alert("Requirement created successfully!");
    setFormData({ title: "", description: "", skills: "", level: "" });
  };

  return (
    <div className="admin-requirement">
      <div className="requirement-container">
        <h1>Requirement Creation</h1>
        <p className="subtitle">Create a new job requirement</p>

        <form onSubmit={handleSubmit} className="requirement-form">
          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Senior Developer"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the job role and responsibilities..."
              rows={5}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="skills">Required Skills (comma separated) *</label>
            <textarea
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="JavaScript, React, TypeScript, Node.js"
              rows={3}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="level">Experience Level *</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              required
            >
              <option value="">Select experience level</option>
              <option value="junior">Junior (0-2 years)</option>
              <option value="mid">Mid-level (2-5 years)</option>
              <option value="senior">Senior (5+ years)</option>
              <option value="lead">Lead (8+ years)</option>
            </select>
          </div>

          <button type="submit" className="submit-btn">
            Create Requirement
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminRequirement;
