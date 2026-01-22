"use client";
import React, { useState } from "react";
import { adminService } from "../../API/services";
import "./TransformCVWidget.scss";

interface TransformResult {
  success: boolean;
  message?: string;
  transformed_text?: string | null;
  filtered_text?: string | null;
  redaction_counts?: { emails?: number; phones?: number; companies?: number };
  extracted_skills?: string[];
}

const TransformCVWidget: React.FC = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [useLLM, setUseLLM] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTransform = async () => {
    setError(null);
    setResult(null);
    if (!cvFile || !jdFile) {
      setError("Please upload both JD and CV files.");
      return;
    }
    setLoading(true);
    try {
      const res = await adminService.transformCV(cvFile, jdFile, useLLM);
      setResult(res);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || e?.message || "Transform failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transform-cv-widget">
      <div className="widget-row">
        <div className="file-inputs">
          <label className="file-label">
            JD
            <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setJdFile(e.target.files?.[0] ?? null)} />
            <small className="filename">{jdFile?.name}</small>
          </label>
          <label className="file-label">
            CV
            <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} />
            <small className="filename">{cvFile?.name}</small>
          </label>
        </div>
        <div className="options">
          <label className="checkbox">
            <input type="checkbox" checked={useLLM} onChange={(e) => setUseLLM(e.target.checked)} /> Use LLM
          </label>
          <button className="btn btn-primary" onClick={handleTransform} disabled={loading}>
            {loading ? "Working..." : "Transform CV"}
          </button>
        </div>
      </div>

      {error && <p className="widget-error">{error}</p>}

      {result && (
        <div className="widget-result">
          <p className="result-message">{result.message}</p>
          {result.redaction_counts && (
            <div className="counts">
              <small>Emails: {result.redaction_counts.emails ?? 0}</small>
              <small>Phones: {result.redaction_counts.phones ?? 0}</small>
              <small>Companies: {result.redaction_counts.companies ?? 0}</small>
            </div>
          )}
          {result.filtered_text && (
            <div className="filtered">
              <h4>Filtered (relevant lines)</h4>
              <pre>{result.filtered_text}</pre>
            </div>
          )}
          {result.transformed_text && (
            <div className="transformed">
              <h4>Transformed (redacted)</h4>
              <pre>{result.transformed_text}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransformCVWidget;
