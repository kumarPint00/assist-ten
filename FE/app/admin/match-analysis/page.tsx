"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const PageShell = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  padding: theme.spacing(5, 3),
  backgroundColor: theme.palette.grey[100],
}));

const HeroCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[2],
}));

const SectionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  minHeight: 220,
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1),
}));

const SummaryStat = styled(Typography)(({ theme }) => ({
  fontSize: "2.5rem",
  fontWeight: 700,
  lineHeight: 1,
  color: theme.palette.primary.main,
}));

type SkillMatchEntry = {
  skill: string;
  jd_priority: "high" | "medium" | "low";
  cv_depth: "strong" | "moderate" | "weak";
};

type MatchAnalysisResponse = {
  overall_match_score: number;
  fit_category: string;
  role_alignment: {
    role_match: boolean;
    seniority_match: string;
    domain_match: boolean;
  };
  skill_match: {
    matched_skills: SkillMatchEntry[];
    missing_critical_skills: string[];
    extra_skills: string[];
  };
  experience_analysis: {
    required_experience_years: number;
    claimed_experience_years: number;
    experience_gap: string;
    relevant_project_count: number;
  };
  strengths: string[];
  weaknesses: string[];
  risk_flags: {
    type: string;
    description: string;
  }[];
  interview_focus_areas: {
    area: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }[];
  recommended_interview_difficulty: string;
  confidence_level: string;
};

const priorityColor = (value: string) => {
  if (value === "high") return "error";
  if (value === "medium") return "warning";
  return "default";
};

const depthColor = (value: SkillMatchEntry["cv_depth"]) => {
  if (value === "strong") return "success";
  if (value === "moderate") return "warning";
  return "default";
};

export default function MatchAnalysisPage() {
  const [matchData, setMatchData] = useState<MatchAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [candidateCv, setCandidateCv] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/match-analysis", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load match data");
        }
        const payload = (await response.json()) as MatchAnalysisResponse;
        setMatchData(payload);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !candidateCv.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await fetch("/api/match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription, candidate_cv: candidateCv }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Matcher request failed.");
      }
      setMatchData(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const analysisDisabled = analyzing || !jobDescription.trim() || !candidateCv.trim();

  return (
    <PageShell>
      <HeroCard>
        <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Interview insights
            </Typography>
            <Typography variant="h4" gutterBottom>
              CV ↔ JD Match Analysis
            </Typography>
            <Typography color="text.secondary" maxWidth={500}>
              Objective signals distilled from the job description and résumé focus every interview on fit, risk,
              and blind spots.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" size="small" disabled>
              Refresh (TBD)
            </Button>
            <Button variant="contained" size="small">
              Generate interview questions
            </Button>
          </Stack>
        </Box>
      </HeroCard>

      <SectionCard sx={{ minHeight: "auto" }}>
        <CardContent>
          <SectionHeader variant="subtitle2">Provide documents</SectionHeader>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Paste the Job Description and Candidate CV to run the real matcher. The analysis honors messy/parsed text.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Job Description"
                placeholder="Paste the JD text here"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                multiline
                minRows={4}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Candidate CV"
                placeholder="Paste the CV text here"
                value={candidateCv}
                onChange={(event) => setCandidateCv(event.target.value)}
                multiline
                minRows={4}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Typography variant="caption" color="text.secondary">
                  Each run executes the matcher against the pasted JD/CV pair; wait a moment for the results to arrive.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAnalyze}
                  disabled={analysisDisabled}
                >
                  {analyzing ? "Analyzing…" : "Run analysis"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </SectionCard>

      {loading && (
        <Box mt={6} textAlign="center">
          <CircularProgress />
          <Typography mt={2}>Loading the latest match analysis…</Typography>
        </Box>
      )}

      {error && (
        <Box mt={4}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {matchData && (
        <Stack spacing={3} mt={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <SectionCard>
                <CardContent>
                  <SectionHeader variant="subtitle2">Match score</SectionHeader>
                  <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                    <SummaryStat>{matchData.overall_match_score}%</SummaryStat>
                    <Box flexGrow={1}>
                      <LinearProgress
                        variant="determinate"
                        value={matchData.overall_match_score}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {matchData.fit_category} · Difficulty: {matchData.recommended_interview_difficulty} · Confidence: {matchData.confidence_level}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Higher scores combine critical skill alignment and tangible project delivery. Use the cards below to
                    understand the assumptions behind the number.
                  </Typography>
                </CardContent>
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={7}>
              <SectionCard>
                <CardContent>
                  <SectionHeader variant="subtitle2">Role & experience snapshot</SectionHeader>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Role language match
                      </Typography>
                      <Typography variant="h6" mt={0.5}>
                        {matchData.role_alignment.role_match ? "Aligned" : "Needs review"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Seniority match
                      </Typography>
                      <Typography variant="h6" mt={0.5}>
                        {matchData.role_alignment.seniority_match}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Domain overlap
                      </Typography>
                      <Typography variant="h6" mt={0.5}>
                        {matchData.role_alignment.domain_match ? "Present" : "Unclear"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Required vs claimed experience
                      </Typography>
                      <Typography variant="h6" mt={0.5}>
                        {matchData.experience_analysis.claimed_experience_years} / {matchData.experience_analysis.required_experience_years} yrs
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Experience gap
                      </Typography>
                      <Chip
                        label={matchData.experience_analysis.experience_gap}
                        size="small"
                        color={priorityColor(matchData.experience_analysis.experience_gap)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Relevant projects
                      </Typography>
                      <Typography variant="h6" mt={0.5}>
                        {matchData.experience_analysis.relevant_project_count}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SectionCard>
                <CardContent>
                  <SectionHeader variant="subtitle2">Skill coverage</SectionHeader>
                  <Stack spacing={1}>
                    {matchData.skill_match.matched_skills.map((entry) => (
                      <Box key={entry.skill} display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1">{entry.skill}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            JD priority: {entry.jd_priority} · CV depth: {entry.cv_depth}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Chip label={entry.jd_priority} size="small" color={priorityColor(entry.jd_priority)} />
                          <Chip label={entry.cv_depth} size="small" color={depthColor(entry.cv_depth)} />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2">Missing critical skills</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                    {matchData.skill_match.missing_critical_skills.length > 0 ? (
                      matchData.skill_match.missing_critical_skills.map((skill) => (
                        <Chip key={`missing-${skill}`} label={skill} size="small" color="error" />
                      ))
                    ) : (
                      <Chip label="None" variant="outlined" size="small" />
                    )}
                  </Stack>
                  <Typography variant="subtitle2" mt={2}>
                    Extra skills on CV
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                    {matchData.skill_match.extra_skills.length > 0 ? (
                      matchData.skill_match.extra_skills.map((skill) => (
                        <Chip key={`extra-${skill}`} label={skill} size="small" variant="outlined" />
                      ))
                    ) : (
                      <Chip label="None" variant="outlined" size="small" />
                    )}
                  </Stack>
                </CardContent>
              </SectionCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionCard>
                <CardContent>
                  <SectionHeader variant="subtitle2">Strengths & weaknesses</SectionHeader>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Strengths
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                        {matchData.strengths.length > 0 ? (
                          matchData.strengths.map((strength) => (
                            <Chip key={`strength-${strength}`} label={strength} color="success" size="small" />
                          ))
                        ) : (
                          <Chip label="Not flagged" variant="outlined" size="small" />
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Weaknesses
                      </Typography>
                      <Stack spacing={0.5} mt={1}>
                        {matchData.weaknesses.length > 0 ? (
                          matchData.weaknesses.map((weakness) => (
                            <Typography key={`weakness-${weakness}`} variant="body2">
                              • {weakness}
                            </Typography>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No clear weaknesses detected from the provided documents.
                          </Typography>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SectionCard>
                <CardContent>
                  <SectionHeader variant="subtitle2">Risk flags</SectionHeader>
                  <Stack spacing={2}>
                    {matchData.risk_flags.length > 0 ? (
                      matchData.risk_flags.map((flag) => (
                        <Box key={flag.description}>
                          <Chip label={flag.type.replace(/_/g, " ")} size="small" />
                          <Typography variant="body2" color="text.secondary" mt={0.5}>
                            {flag.description}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No additional risk flags detected.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </SectionCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionCard>
                <CardContent>
                  <SectionHeader variant="subtitle2">Interview focus areas</SectionHeader>
                  <Stack spacing={2}>
                    {matchData.interview_focus_areas.map((area) => (
                      <Box key={area.area}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">{area.area}</Typography>
                          <Chip label={area.priority} size="small" color={priorityColor(area.priority)} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {area.reason}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>
        </Stack>
      )}
    </PageShell>
  );
}
