"use client";
import React, { useState } from "react";
import "./AdminAddCandidate.scss";

const AdminAddCandidate = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    skills: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Add Candidate:", formData);
    alert("Candidate added successfully!");
    setFormData({ name: "", email: "", role: "", skills: "" });
  };

  return (
    <div className="admin-add-candidate">
      <div className="candidate-container">
        <h1>Add Candidate</h1>
        <p className="subtitle">Add a new candidate to the system</p>

        <form onSubmit={handleSubmit} className="candidate-form">
          <div className="form-group">
            <label htmlFor="name">Candidate Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select a role</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="manager">Manager</option>
              <option value="analyst">Analyst</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="skills">Skills (comma separated) *</label>
            <textarea
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="JavaScript, React, TypeScript"
              rows={4}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-btn">
            Add Candidate
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAddCandidate;
