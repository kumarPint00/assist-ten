"use client";
import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { CircularGauge } from "../../components/ui";
import "./AdminSkillChecker.scss";
import SectionLayout from "../../components/ui/SectionLayout";
import { uploadService } from "../../API/services";
import FileUpload from "../AssessmentSetupContainer/components/FileUpload";
import SkillMatcherInsights from "../../components/admin/SkillMatcherInsights";
import { FiUpload, FiCheckCircle, FiX } from "react-icons/fi";

const AdminSkillChecker: React.FC = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [cvExtractedText, setCvExtractedText] = useState<string | null>(null);
  const [jdExtractedText, setJdExtractedText] = useState<string | null>(null);
  const [cvUploadKey, setCvUploadKey] = useState<number>(Date.now());
  const [jdUploadKey, setJdUploadKey] = useState<number>(Date.now() + 1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useLLM, setUseLLM] = useState<boolean>(true);
  const [history, setHistory] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [classificationInfo, setClassificationInfo] = useState<any | null>(null);

  const handleSubmit = async () => {
    if (!cvFile || !jdFile) {
      setError("Please upload both JD and CV files.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await uploadService.skillMatch(cvFile, jdFile, useLLM);
      if (res && res.success === false) {
        const warning = res.details?.warning || 'Server refused to compute match: please verify file uploads.';
        setError(warning);
        setResult(null);
        setClassificationInfo(res.details?.classification || null);
      } else {
        setResult(res);
        setError(null);
        setClassificationInfo(res?.details?.classification || null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to run skill match");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await uploadService.getSkillMatches(0, 20);
      setHistory(res || []);
    } catch (err: any) {
      // silently ignore
      console.error("Failed to load match history", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <SectionLayout className="assessment-page">
      <div className="card admin-skill-checker">
        <div className="card-header">
          <h2>Skill Matching Checker</h2>
          <p className="hint">Upload Job Description (JD) and Candidate CV to compute a skill match score.</p>
        </div>

      <div className="upload-grid">
        <div>
          <FileUpload key={jdUploadKey} label="Job Description (JD)" onFileSelect={(f) => setJdFile(f)} onTextExtracted={(t) => setJdExtractedText(t)} />
        </div>
        <div>
          <FileUpload key={cvUploadKey} label="Candidate CV" onFileSelect={(f) => setCvFile(f)} onTextExtracted={(t) => setCvExtractedText(t)} isRequired />
        </div>
      </div>

      <div className="card-actions">
        <label className="checkbox-label">
          <input type="checkbox" checked={useLLM} onChange={(e) => setUseLLM(e.target.checked)} /> Use LLM-based extraction
        </label>
        <button className="btn primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (<><CircularProgress size={18} style={{ color: 'white', marginRight: 8 }} /> Running...</>) : "Run Match"}
        </button>
        <button className="btn" onClick={() => { setCvFile(null); setJdFile(null); setResult(null); setError(null); setCvExtractedText(null); setJdExtractedText(null); setCvUploadKey(Date.now()); setJdUploadKey(Date.now() + 1); }}>
          Reset
        </button>
      </div>

      {error && <div className="error">{error}</div>}

        {result && (
        <div className="result">
          <div className="score">Match Score: <strong style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CircularGauge score={result.match_score} size={84} strokeWidth={10} />
            <span style={{ fontSize: 18 }}>{result.match_score}%</span>
          </strong></div>
          <div className="match-lists">
            <div className="list">
              <h3>Matched Skills</h3>
              <ul>{result.matched_skills.map((m:any, idx:number) => (<li key={idx}>{m.skill_name} — CV: {m.cv_proficiency} JD: {m.jd_proficiency} ({Math.round((m.confidence || 0) * 100)}%)</li>))}</ul>
            </div>
            <div className="list">
              <h3>Missing Skills (in JD, not in CV)</h3>
              <ul>{result.missing_skills.map((s:string, idx:number) => (<li key={idx}>{s}</li>))}</ul>
            </div>
            <div className="list">
              <h3>Extra CV Skills (not in JD)</h3>
              <ul>{result.extra_skills.map((s:string, idx:number) => (<li key={idx}>{s}</li>))}</ul>
            </div>
          </div>
          </div>
        )}

        {result?.details?.warnings && result.details.warnings.length > 0 && (
          <div className="warning-box" style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#fff7ed', border: '1px solid #f5d0a2', color: '#92400e' }}>
            <strong>Warnings:</strong>
            <ul>
              {result.details.warnings.map((w: string, idx: number) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {(result?.details?.classification || classificationInfo) && (
          <div className="classification-box" style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3' }}>
            <strong>Document classification:</strong>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div><strong>JD:</strong> {(result?.details?.classification?.jd?.document_type || classificationInfo?.jd?.document_type || '')} (Conf: {Math.round(((result?.details?.classification?.jd?.confidence || classificationInfo?.jd?.confidence) || 0)*100)}%)</div>
              <div><strong>CV:</strong> {(result?.details?.classification?.cv?.document_type || classificationInfo?.cv?.document_type || '')} (Conf: {Math.round(((result?.details?.classification?.cv?.confidence || classificationInfo?.cv?.confidence) || 0)*100)}%)</div>
            </div>
            {(result?.details?.classification?.jd?.reason || classificationInfo?.jd?.reason) && <div style={{ marginTop: 8 }}><em>JD reason: {(result?.details?.classification?.jd?.reason || classificationInfo?.jd?.reason || '')}</em></div>}
            {(result?.details?.classification?.cv?.reason || classificationInfo?.cv?.reason) && <div style={{ marginTop: 4 }}><em>CV reason: {(result?.details?.classification?.cv?.reason || classificationInfo?.cv?.reason || '')}</em></div>}
          </div>
        )}
      </div>
      <div className="card history" style={{ padding: 16 }}>
          <h3>Past Runs</h3>
          {history.length === 0 ? (
            <p>No match runs yet.</p>
          ) : (
            <ul className="history-list">
              {history.map((h: any) => (
                <li key={h.match_id} className="history-item">
                  <div className="history-meta">
                    <strong>{h.match_score}%</strong>
                    <span>{new Date(h.created_at).toLocaleString()}</span>
                    <span>id: {h.match_id}</span>
                  </div>
                  <div className="history-actions">
                    <button className="btn btn-light" onClick={async () => { const detail = await uploadService.getSkillMatch(h.match_id); setSelected(detail); }}>
                      View
                    </button>
                  </div>
                  {selected && selected.match_id === h.match_id && (
                    <div className="history-detail">
                      <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(selected, null, 2)}</pre>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ marginTop: 24 }}>
          <SkillMatcherInsights result={result} loading={loading} />
        </div>
      </SectionLayout>
  );
};

export default AdminSkillChecker;
