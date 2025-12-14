"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const PageShell = styled(Box)(({ theme }) => ({
  width: "100%",
}));

const SectionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  marginBottom: theme.spacing(3),
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1),
}));

const SectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.85rem",
  fontWeight: 600,
  color: theme.palette.text.secondary,
}));

type SkillRow = {
  skill: string;
  priority: string;
  depth: string;
  status: "matched" | "partial" | "missing";
  notes: string;
};

type SkillNote = {
  skill: string;
  note: string;
};

type RiskFlag = {
  type: string;
  description: string;
  probe: string;
};

type FocusArea = {
  area: string;
  reason: string;
  priority: string;
};

type SkillMatcherInsightsProps = {
  result: any | null;
  loading: boolean;
};

const fallbackRows: SkillRow[] = [
  {
    skill: "Distributed systems",
    priority: "High",
    depth: "Strong",
    status: "matched",
    notes: "Designed multi-region APIs aligned with this JD",
  },
  {
    skill: "Security reviews",
    priority: "High",
    depth: "Moderate",
    status: "partial",
    notes: "Built tooling but lacked enterprise policy ownership",
  },
  {
    skill: "AI inferencing",
    priority: "Medium",
    depth: "Weak",
    status: "partial",
    notes: "Mentions exposure but no ownership",
  },
  {
    skill: "Cloud networking",
    priority: "Low",
    depth: "Weak",
    status: "missing",
    notes: "No explicit projects listed",
  },
];

const fallbackMissing: SkillNote[] = [
  { skill: "Cloud networking", note: "Required for core platform resilience" },
  { skill: "Zero-trust architecture", note: "Essential requirement" },
];
const fallbackExtra: SkillNote[] = [
  { skill: "Python scripting", note: "Useful automation bonus" },
  { skill: "Employee coaching", note: "Signals leadership" },
];

const fallbackRiskFlags: RiskFlag[] = [
  {
    type: "Overclaim",
    description: "Resume claims ownership of a migration but lacks detail.",
    probe: "Describe the piece you actually delivered.",
  },
  {
    type: "Shallow experience",
    description: "Security reviews appear observational without remediation.",
    probe: "Walk through a security finding you closed end-to-end.",
  },
  {
    type: "Unclear contribution",
    description: "Projects list team effort without stating candidate’s role.",
    probe: "What part of the project did you own?",
  },
];

const fallbackFocus: FocusArea[] = [
  {
    area: "Security reviews",
    reason: "High JD priority but only moderate depth",
    priority: "High",
  },
  {
    area: "Cloud networking",
    reason: "Missing skill but flagged as core",
    priority: "High",
  },
  {
    area: "AI inferencing",
    reason: "Medium priority yet weak delivery",
    priority: "Medium",
  },
];

export default function SkillMatcherInsights({ result, loading }: SkillMatcherInsightsProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "matched" | "partial" | "missing">("all");
  const [sortAsc, setSortAsc] = useState(true);

  const rows: SkillRow[] = useMemo(() => {
    if (!result?.matched_skills) return fallbackRows;

    const mapped: SkillRow[] = result.matched_skills.map((item: any) => ({
      skill: item.skill_name,
      priority: item.jd_proficiency ?? "Medium",
      depth: item.cv_proficiency ?? "Moderate",
      status: item.cv_proficiency?.toLowerCase?.() === "strong" ? "matched" : "partial",
      notes: item.notes || `${item.skill_name} coverage seen in resume`,
    }));

    const missing = (result.missing_skills || []).map((skill: string) => ({
      skill,
      priority: "High",
      depth: "Weak",
      status: "missing" as const,
      notes: "Required but not demonstrated",
    }));

    return mapped.concat(missing);
  }, [result]);

  const filteredRows = useMemo(() => {
    const base = rows.filter((row) => (statusFilter === "all" ? true : row.status === statusFilter));
    const order = ["High", "Medium", "Low"];
    return [...base].sort((a, b) => {
      const ai = order.indexOf(a.priority);
      const bi = order.indexOf(b.priority);
      return sortAsc ? ai - bi : bi - ai;
    });
  }, [rows, statusFilter, sortAsc]);

  const missingList: SkillNote[] = result?.missing_skills?.map((skill: string) => ({
    skill,
    note: "Required for role",
  })) || fallbackMissing;

  const extraList: SkillNote[] = result?.extra_skills?.map((skill: string) => ({
    skill,
    note: "Additional CV strength",
  })) || fallbackExtra;

  const riskFlags: RiskFlag[] = result?.details?.risk_flags || fallbackRiskFlags;
  const focusAreas: FocusArea[] = result?.details?.interview_focus || fallbackFocus;

  const summaryStats = [
    { label: "Confidence", value: result?.details?.confidence_level || "Medium" },
    { label: "Interview difficulty", value: result?.details?.recommended_interview_difficulty || "Medium" },
    { label: "Strengths", value: result?.details?.strengths?.join(" · ") || "Distributed systems, Security" },
    { label: "Weaknesses", value: result?.details?.weaknesses?.join(" · ") || "Cloud networking, Zero-trust" },
  ];

  const overallScore = result?.match_score ?? result?.overall_match_score ?? 78;
  const fitCategory = result?.fit_category ?? "Good";
  const roleMatch = result?.role_alignment?.role_match ?? true;
  const seniorityMatch = result?.role_alignment?.seniority_match ?? "Mid";
  const domainMatch = result?.role_alignment?.domain_match ?? true;

  return (
    <PageShell>
      <SectionCard sx={{ padding: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={9}>
            <SectionHeader variant="h5">Candidate match analysis</SectionHeader>
            <Typography variant="body2" color="text.secondary">
              Candidate: {result?.candidate_name || "Candidate"} · Job: {result?.job_title || "Target role"} · Overall score: {overallScore} · Fit: {fitCategory}
            </Typography>
            <Stack direction="row" spacing={2} mt={1}>
              <Chip variant="outlined" label={`Role match (${roleMatch ? "Yes" : "No"})`} />
              <Chip variant="outlined" label={`Seniority ${seniorityMatch}`} />
              <Chip variant="outlined" label={`Domain match (${domainMatch ? "Yes" : "No"})`} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack spacing={1} alignItems="flex-end">
              <Typography variant="h4">{overallScore}</Typography>
              <Chip label={fitCategory} />
            </Stack>
          </Grid>
        </Grid>
      </SectionCard>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SectionCard>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <SectionHeader variant="h6">Skill match breakdown</SectionHeader>
                </Grid>
                <Grid item>
                  <Stack direction="row" spacing={1}>
                    {( ["all", "matched", "partial", "missing"] as const ).map((option) => (
                      <Chip
                        key={option}
                        label={option === "all" ? "All" : option}
                        variant={statusFilter === option ? "filled" : "outlined"}
                        size="small"
                        sx={{ textTransform: "capitalize" }}
                        onClick={() => setStatusFilter(option)}
                      />
                    ))}
                  </Stack>
                </Grid>
                <Grid item>
                  <Button size="small" variant="text" onClick={() => setSortAsc((prev) => !prev)}>
                    Sort by priority {sortAsc ? "↑" : "↓"}
                  </Button>
                </Grid>
              </Grid>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Skill</TableCell>
                      <TableCell>JD priority</TableCell>
                      <TableCell>Candidate depth</TableCell>
                      <TableCell>Match status</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={`${row.skill}-${row.status}`}>
                        <TableCell>{row.skill}</TableCell>
                        <TableCell>{row.priority}</TableCell>
                        <TableCell>{row.depth}</TableCell>
                        <TableCell>
                          <Chip label={row.status} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{row.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </SectionCard>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SectionCard>
                <CardContent>
                  <SectionHeader variant="h6">Missing critical skills</SectionHeader>
                  <Stack spacing={1}>
                    {missingList.map((item) => (
                      <Box key={item.skill}>
                        <Typography variant="body1">{item.skill}</Typography>
                        <SectionLabel>{item.note}</SectionLabel>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard>
                <CardContent>
                  <SectionHeader variant="h6">Extra skills</SectionHeader>
                  <Stack spacing={1}>
                    {extraList.map((item) => (
                      <Box key={item.skill}>
                        <Typography variant="body1">{item.skill}</Typography>
                        <SectionLabel>{item.note}</SectionLabel>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>

          <SectionCard>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <SectionHeader variant="h6">Experience & risk</SectionHeader>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      Required vs claimed experience: {result?.required_experience_years ?? 7} yrs · {result?.claimed_experience_years ?? 5} yrs
                    </Typography>
                    <Typography variant="body2">Experience gap: {result?.experience_gap ?? "Minor"}</Typography>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={2}>
                    {riskFlags.map((flag) => (
                      <Box key={flag.type}>
                        <Typography variant="subtitle1">{flag.type}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {flag.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Interview probe: {flag.probe}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SectionHeader variant="h6">Interview focus areas</SectionHeader>
                  <Stack spacing={1}>
                    {focusAreas.map((item) => (
                      <Stack key={item.area} spacing={0.5}>
                        <Typography variant="body1">{item.area}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.reason}
                        </Typography>
                        <Chip label={item.priority} size="small" variant="outlined" />
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <SectionCard>
            <CardContent>
              <SectionHeader variant="h6">Summary & actions</SectionHeader>
              <Stack spacing={1}>
                {summaryStats.map((stat) => (
                  <Box key={stat.label}>
                    <SectionLabel>{stat.label}</SectionLabel>
                    <Typography variant="body1">{stat.value}</Typography>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Button variant="outlined">Generate assessment</Button>
                <Button variant="outlined">Proceed to interview</Button>
                <Button variant="contained">Shortlist candidate</Button>
                <Button variant="text">Reject candidate</Button>
              </Stack>
            </CardContent>
          </SectionCard>
        </Grid>
      </Grid>
    </PageShell>
  );
}
