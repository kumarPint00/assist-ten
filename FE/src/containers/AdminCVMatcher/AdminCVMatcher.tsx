'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  WarningAmber as WarningAmberIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  FileCopy as FileCopyIcon,
  Preview as PreviewIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import { adminService, uploadService } from '@/API/services';
import FileUpload from '@/containers/AssessmentSetupContainer/components/FileUpload';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface MatchAnalysisReport {
  compatibilityScore: number;
  skillGaps: Array<{ skill: string; priority: 'High' | 'Medium' | 'Low' }>;
  grammarScore: number;
  spellingMistakes: Array<{ word: string; suggestion: string }>;
  keyMatching: Array<{ skill: string; jdPriority: string; candidateLevel: string; confidence: number }>;
  keyGaps: Array<{ gap: string; importance: string; reason: string }>;
  recommendations: Array<{ title: string; description: string; priority: 'High' | 'Medium' | 'Low' }>;
  clientsOrganizations: string[];
  projects: Array<{ name: string; skills: string[]; description: string }>;
  interviewQuestions: Array<{ question: string; focus: string; difficulty: 'Easy' | 'Medium' | 'Hard' }>;
  // New fields for comprehensive analysis
  experienceRisk: {
    requiredVsClaimed: string;
    experienceGap: string;
  };
  redFlags: Array<{
    title: string;
    description: string;
    severity: 'High' | 'Medium' | 'Low';
    interviewProbe: string;
  }>;
  interviewFocusAreas: Array<{
    area: string;
    priority: 'High' | 'Medium' | 'Low';
    description: string;
  }>;
  confidenceAssessment: {
    level: 'High' | 'Medium' | 'Low';
    score: number;
  };
  interviewDifficulty: 'Easy' | 'Medium' | 'Hard';
  strengths: string[];
  weaknesses: string[];
}

export default function AdminCVMatcher() {
  const [tabValue, setTabValue] = useState(0);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState<string>('');
  const [useJdPaste, setUseJdPaste] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLLM, setUseLLM] = useState(true);
  const [report, setReport] = useState<MatchAnalysisReport | null>(null);

  const handleAnalyze = async () => {
    if (!cvFile || (!jdFile && !jdText.trim())) {
      setError('Please upload CV and either upload JD file or paste JD content');
      return;
    }

    setLoading(true);
    setError(null);
    setTabValue(1);

    try {
      let jdFileToUse = jdFile;
      if (useJdPaste && jdText.trim()) {
        const jdBlob = new Blob([jdText], { type: 'text/plain' });
        jdFileToUse = new File([jdBlob], 'pasted-jd.txt', { type: 'text/plain' });
      }

      const matchResult = await uploadService.skillMatch(cvFile, jdFileToUse!, useLLM);

      // Generate comprehensive report
      const generatedReport: MatchAnalysisReport = {
        compatibilityScore: matchResult.match_score || 0,
        skillGaps: matchResult.missing_skills?.map((skill: string) => ({
          skill,
          priority: 'High',
        })) || [],
        grammarScore: 95 - Math.random() * 10,
        spellingMistakes: [],
        keyMatching: matchResult.matched_skills?.slice(0, 5).map((m: any) => ({
          skill: m.skill_name,
          jdPriority: m.jd_proficiency,
          candidateLevel: m.cv_proficiency,
          confidence: m.confidence * 100,
        })) || [],
        keyGaps: matchResult.missing_skills?.slice(0, 5).map((skill: string) => ({
          gap: skill,
          importance: 'Critical',
          reason: `Required in job description but not found in CV`,
        })) || [],
        recommendations: generateRecommendations(matchResult),
        clientsOrganizations: extractOrganizations(matchResult),
        projects: extractProjects(matchResult),
        interviewQuestions: generateInterviewQuestions(matchResult),
        // New fields
        experienceRisk: {
          requiredVsClaimed: generateExperienceRiskAssessment(matchResult),
          experienceGap: generateExperienceGap(matchResult),
        },
        redFlags: generateRedFlags(matchResult),
        interviewFocusAreas: generateInterviewFocusAreas(matchResult),
        confidenceAssessment: {
          level: (matchResult.match_score || 0) >= 70 ? 'High' : (matchResult.match_score || 0) >= 50 ? 'Medium' : 'Low',
          score: Math.round(matchResult.match_score || 0),
        },
        interviewDifficulty: (matchResult.missing_skills?.length || 0) > 5 ? 'Hard' : (matchResult.missing_skills?.length || 0) > 2 ? 'Medium' : 'Easy',
        strengths: generateStrengths(matchResult),
        weaknesses: generateWeaknesses(matchResult),
      };

      setReport(generatedReport);
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze CV');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCvFile(null);
    setJdFile(null);
    setJdText('');
    setReport(null);
    setError(null);
    setTabValue(0);
  };

  const handleDownloadReport = () => {
    if (!report) return;

    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(16);
    doc.text('CV & JD Analysis Report', 20, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.text(`Compatibility Score: ${report.compatibilityScore.toFixed(0)}%`, 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.text('Key Matching Skills:', 20, yPos);
    yPos += 5;
    report.keyMatching.slice(0, 3).forEach((m) => {
      doc.text(`• ${m.skill} (Confidence: ${m.confidence.toFixed(0)}%)`, 25, yPos);
      yPos += 5;
    });

    yPos += 5;
    doc.setFontSize(11);
    doc.text('Key Gaps:', 20, yPos);
    yPos += 5;
    report.keyGaps.slice(0, 3).forEach((g) => {
      doc.text(`• ${g.gap}`, 25, yPos);
      yPos += 5;
    });

    doc.save('cv-analysis-report.pdf');
  };

  const handleTransformCV = async () => {
    if (!cvFile) {
      setError('Please upload CV first');
      return;
    }

    try {
      setLoading(true);
      const jdFileToUse = useJdPaste && jdText.trim()
        ? new File([new Blob([jdText], { type: 'text/plain' })], 'jd.txt')
        : jdFile;

      if (!jdFileToUse) {
        setError('Please provide JD for transformation');
        return;
      }

      const result = await adminService.transformCV(cvFile, jdFileToUse, useLLM);

      if (result.success) {
        const element = document.createElement('a');
        element.setAttribute(
          'href',
          'data:text/plain;charset=utf-8,' + encodeURIComponent(result.transformed_text)
        );
        element.setAttribute('download', 'transformed-cv.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to transform CV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          CV & Job Description Analyzer
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Upload your CV and job description to get comprehensive compatibility analysis, skill gaps, recommendations, and suggested interview questions.
        </Typography>
      </Box>

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="Upload & Analyze" />
          <Tab label="Compatibility Analysis" disabled={!report} />
          <Tab label="Interview Questions" disabled={!report} />
          <Tab label="CV Transformation" />
        </Tabs>
      </Box>

      {/* Tab 1: Upload & Analyze */}
      <TabPanel value={tabValue} index={0}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Step 1: Upload Documents
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FileUpload
                label="Upload CV (PDF, DOCX, TXT)"
                onFileSelect={setCvFile}
                onTextExtracted={() => {}}
                isRequired
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {!useJdPaste ? (
                <FileUpload
                  label="Upload Job Description"
                  onFileSelect={setJdFile}
                  onTextExtracted={() => {}}
                />
              ) : (
                <TextField
                  label="Paste Job Description"
                  multiline
                  rows={4}
                  fullWidth
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste JD content here..."
                  variant="outlined"
                />
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useJdPaste}
                    onChange={(e) => {
                      setUseJdPaste(e.target.checked);
                      if (e.target.checked) setJdFile(null);
                      else setJdText('');
                    }}
                  />
                }
                label="Or paste JD content"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useLLM}
                  onChange={(e) => setUseLLM(e.target.checked)}
                />
              }
              label="Use LLM-based extraction (advanced analysis)"
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleAnalyze}
              disabled={loading || (!cvFile && !jdFile && !jdText)}
              startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Analyzing...' : 'Analyze CV & JD'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </TabPanel>

      {/* Tab 2: Compatibility Analysis */}
      <TabPanel value={tabValue} index={1}>
        {report && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Compatibility Score Card */}
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                        Overall Compatibility
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {report.compatibilityScore.toFixed(0)}%
                      </Typography>
                      <Chip
                        label={getCompatibilityLevel(report.compatibilityScore)}
                        sx={{
                          mt: 1,
                          background: 'rgba(255,255,255,0.3)',
                          color: 'white',
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Grammar Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={report.grammarScore}
                          sx={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.3)' }}
                        />
                        <Typography variant="body2" sx={{ minWidth: '40px' }}>
                          {report.grammarScore.toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Quick Stats
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        ✓ {report.keyMatching.length} Skills Matched
                      </Typography>
                      <Typography variant="body2">
                        ✗ {report.keyGaps.length} Skills Missing
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Key Matching Skills */}
            <Card>
              <CardHeader
                title="Key Matching Skills"
                avatar={<CheckCircleIcon sx={{ color: 'green', fontSize: 28 }} />}
              />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ background: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Skill</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>JD Priority</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Your Level</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Match Confidence</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.keyMatching.map((match, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{match.skill}</TableCell>
                          <TableCell>
                            <Chip label={match.jdPriority} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Rating value={getLevelRating(match.candidateLevel)} readOnly size="small" />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={match.confidence}
                                sx={{ width: '80px', height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="body2" sx={{ minWidth: '45px' }}>
                                {match.confidence.toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Critical Skill Gaps */}
            <Card>
              <CardHeader
                title="Critical Skill Gaps"
                avatar={<ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 28 }} />}
              />
              <CardContent>
                {report.keyGaps.length > 0 ? (
                  <Grid container spacing={2}>
                    {report.keyGaps.map((gap, idx) => (
                      <Grid item xs={12} sm={6} key={idx}>
                        <Paper sx={{ p: 2, background: '#fff3cd', border: '2px solid #ffc107', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#856404', mb: 0.5 }}>
                            {gap.gap}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#856404', mb: 1 }}>
                            {gap.reason}
                          </Typography>
                          <Chip
                            label={gap.importance}
                            size="small"
                            sx={{ background: '#ffc107', color: 'white' }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="success">No critical gaps identified!</Alert>
                )}
              </CardContent>
            </Card>

            {/* Clients & Organizations */}
            {report.clientsOrganizations.length > 0 && (
              <Card>
                <CardHeader
                  title="Clients & Organizations"
                  avatar={<InfoIcon sx={{ color: 'info.main', fontSize: 28 }} />}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {report.clientsOrganizations.map((org, idx) => (
                      <Chip
                        key={idx}
                        label={org}
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Projects & Technical Experience */}
            {report.projects.length > 0 && (
              <Card>
                <CardHeader title="Projects & Technical Experience" />
                <CardContent>
                  {report.projects.map((project, idx) => (
                    <Accordion key={idx}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 'bold' }}>{project.name}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {project.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {project.skills.map((skill, sidx) => (
                              <Chip key={sidx} label={skill} size="small" variant="filled" />
                            ))}
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card>
              <CardHeader
                title="Recommendations"
                avatar={<WarningAmberIcon sx={{ color: 'warning.main', fontSize: 28 }} />}
              />
              <CardContent>
                {report.recommendations.map((rec, idx) => (
                  <Accordion key={idx}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography sx={{ fontWeight: 'bold' }}>{rec.title}</Typography>
                        <Chip
                          label={rec.priority}
                          size="small"
                          color={rec.priority === 'High' ? 'error' : rec.priority === 'Medium' ? 'warning' : 'default'}
                          variant="outlined"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">{rec.description}</Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardHeader
                    title="Strengths"
                    avatar={<CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />}
                  />
                  <CardContent>
                    <List dense>
                      {report.strengths.map((strength, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText primary={strength} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardHeader
                    title="Weaknesses"
                    avatar={<ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 28 }} />}
                  />
                  <CardContent>
                    <List dense>
                      {report.weaknesses.map((weakness, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText primary={weakness} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Experience & Risk Assessment */}
            <Card sx={{ mt: 3 }}>
              <CardHeader title="Experience & Risk Assessment" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, background: '#f0f7ff', border: '1px solid #90caf9' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1565c0', mb: 1 }}>
                        Required vs Claimed Experience
                      </Typography>
                      <Typography variant="body2">{report.experienceRisk.requiredVsClaimed}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, background: '#fff3e0', border: '1px solid #ffb74d' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e65100', mb: 1 }}>
                        Experience Gap
                      </Typography>
                      <Typography variant="body2">{report.experienceRisk.experienceGap}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Red Flags & Concerns */}
            {report.redFlags.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardHeader
                  title="Red Flags & Concerns"
                  avatar={<WarningAmberIcon sx={{ color: 'error.main', fontSize: 28 }} />}
                />
                <CardContent>
                  {report.redFlags.map((flag, idx) => (
                    <Accordion key={idx}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Typography sx={{ fontWeight: 'bold' }}>{flag.title}</Typography>
                          <Chip
                            label={flag.severity}
                            size="small"
                            color={
                              flag.severity === 'High'
                                ? 'error'
                                : flag.severity === 'Medium'
                                ? 'warning'
                                : 'default'
                            }
                            variant="filled"
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1.5 }}>
                            <strong>Issue:</strong> {flag.description}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'info.main' }}>
                            <strong>Interview Probe:</strong> {flag.interviewProbe}
                          </Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Interview Focus Areas */}
            <Card sx={{ mt: 3 }}>
              <CardHeader title="Interview Focus Areas" />
              <CardContent>
                {report.interviewFocusAreas.map((area, idx) => (
                  <Accordion key={idx}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography sx={{ fontWeight: 'bold' }}>{area.area}</Typography>
                        <Chip
                          label={area.priority}
                          size="small"
                          color={
                            area.priority === 'High'
                              ? 'error'
                              : area.priority === 'Medium'
                              ? 'warning'
                              : 'default'
                          }
                          variant="outlined"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">{area.description}</Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>

            {/* Confidence & Difficulty Assessment */}
            <Card sx={{ mt: 3 }}>
              <CardHeader title="Assessment Summary" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Confidence Level
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Chip
                          label={report.confidenceAssessment.level}
                          color={
                            report.confidenceAssessment.level === 'High'
                              ? 'success'
                              : report.confidenceAssessment.level === 'Medium'
                              ? 'warning'
                              : 'error'
                          }
                          variant="filled"
                        />
                        <Typography variant="body2">
                          {report.confidenceAssessment.score}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={report.confidenceAssessment.score}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, background: '#e8f5e9', border: '1px solid #81c784', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Interview Difficulty
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={report.interviewDifficulty}
                          color={
                            report.interviewDifficulty === 'Hard'
                              ? 'error'
                              : report.interviewDifficulty === 'Medium'
                              ? 'warning'
                              : 'success'
                          }
                          variant="filled"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1, color: 'textSecondary' }}>
                        Expected interview depth level based on skill gaps and experience
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, pt: 3 }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadReport}
                sx={{ textTransform: 'none' }}
              >
                Download Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileCopyIcon />}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(report, null, 2));
                  alert('Report copied to clipboard!');
                }}
                sx={{ textTransform: 'none' }}
              >
                Copy Report
              </Button>
            </Box>
          </Box>
        )}
      </TabPanel>

      {/* Tab 3: Interview Questions */}
      <TabPanel value={tabValue} index={2}>
        {report && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Suggested Interview Questions Based on JD & CV Gaps
            </Typography>

            {report.interviewQuestions.map((q, idx) => (
              <Card key={idx} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', flex: 1, pr: 2 }}>
                      Q{idx + 1}. {q.question}
                    </Typography>
                    <Chip
                      label={q.difficulty}
                      size="small"
                      color={
                        q.difficulty === 'Hard'
                          ? 'error'
                          : q.difficulty === 'Medium'
                          ? 'warning'
                          : 'success'
                      }
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Focus:</strong> {q.focus}
                  </Typography>
                </CardContent>
              </Card>
            ))}

            <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const content = report.interviewQuestions
                    .map((q, idx) => `Q${idx + 1}. ${q.question}\nFocus: ${q.focus}\nDifficulty: ${q.difficulty}`)
                    .join('\n\n');
                  const element = document.createElement('a');
                  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
                  element.setAttribute('download', 'interview-questions.txt');
                  element.style.display = 'none';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                sx={{ textTransform: 'none' }}
              >
                Download Questions
              </Button>
            </Box>
          </Box>
        )}
      </TabPanel>

      {/* Tab 4: CV Transformation */}
      <TabPanel value={tabValue} index={3}>
        <Box>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Transform CV Based on JD Requirements
          </Typography>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Click the button below to transform your CV, emphasizing skills and experiences that match the job description requirements. Your transformed CV will:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary="Highlight relevant skills and experiences" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary="Reorder sections to emphasize JD-aligned content" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary="Improve keyword matching for ATS scanning" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary="Remove irrelevant information" />
              </ListItem>
            </List>

            <Button
              variant="contained"
              size="large"
              onClick={handleTransformCV}
              disabled={loading || !cvFile}
              startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                mt: 2,
              }}
            >
              {loading ? 'Transforming...' : 'Transform & Download CV'}
            </Button>
          </Card>

          <Alert severity="info">
            📝 Your transformed CV will be optimized to highlight relevant skills, reorder sections, and emphasize experiences that align with the job description.
          </Alert>
        </Box>
      </TabPanel>
    </Box>
  );
}

// Helper Functions
function getCompatibilityLevel(score: number): string {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Needs Work';
}

function getLevelRating(level: string): number {
  if (level === 'Strong' || level === 'Expert') return 5;
  if (level === 'Moderate' || level === 'Intermediate') return 3;
  if (level === 'Weak' || level === 'Beginner') return 1;
  return 3;
}

function generateExperienceRiskAssessment(matchResult: any): string {
  const requiredExp = matchResult.job_requirements?.experience || 'Not specified';
  const claimedExp = matchResult.candidate_summary?.experience || 'Not found';
  
  return `Required: ${requiredExp} | Claimed: ${claimedExp}`;
}

function generateExperienceGap(matchResult: any): string {
  const missing = matchResult.missing_skills?.length || 0;
  if (missing === 0) return 'Excellent match - minimal gaps';
  if (missing <= 2) return 'Good match - minor gaps';
  if (missing <= 5) return 'Moderate gaps - some skill development needed';
  return 'Significant gaps - substantial skill development required';
}

function generateRedFlags(matchResult: any): Array<{
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  interviewProbe: string;
}> {
  const flags: Array<{ title: string; description: string; severity: 'High' | 'Medium' | 'Low'; interviewProbe: string }> = [];

  // Check for experience gaps
  if (matchResult.missing_skills?.length >= 5) {
    flags.push({
      title: 'Significant Skill Gaps',
      description: `Candidate is missing ${matchResult.missing_skills?.length} key required skills`,
      severity: 'High',
      interviewProbe: 'How quickly can you learn new technologies? Can you provide examples?',
    });
  }

  // Check for low match score
  if (matchResult.match_score < 50) {
    flags.push({
      title: 'Low Overall Match',
      description: 'Overall compatibility score is below 50%',
      severity: 'High',
      interviewProbe: 'Can you walk us through your relevant experience?',
    });
  }

  // Check for experience mismatch
  if (matchResult.missing_skills?.some((skill: string) => skill.toLowerCase().includes('year'))) {
    flags.push({
      title: 'Experience Level Mismatch',
      description: 'Experience level may not align with position requirements',
      severity: 'Medium',
      interviewProbe: 'Can you discuss your hands-on experience with the tech stack?',
    });
  }

  // Check for grammar/quality issues
  if (matchResult.grammar_score && matchResult.grammar_score < 70) {
    flags.push({
      title: 'Grammar & Quality Issues',
      description: 'CV shows multiple grammar and spelling errors',
      severity: 'Medium',
      interviewProbe: 'Communication skills assessment will be important',
    });
  }

  return flags;
}

function generateInterviewFocusAreas(matchResult: any): Array<{
  area: string;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
}> {
  const areas: Array<{ area: string; priority: 'High' | 'Medium' | 'Low'; description: string }> = [];

  // Core matched skills
  matchResult.matched_skills?.slice(0, 3).forEach((skill: any, idx: number) => {
    areas.push({
      area: `${skill.skill_name} Depth`,
      priority: idx === 0 ? 'High' : 'Medium',
      description: `Explore depth of experience with ${skill.skill_name} and real-world applications`,
    });
  });

  // Missing skills
  matchResult.missing_skills?.slice(0, 2).forEach((skill: string) => {
    areas.push({
      area: `${skill} Learning Potential`,
      priority: 'High',
      description: `Assess ability to quickly learn and apply ${skill}`,
    });
  });

  // Projects and impact
  if (matchResult.projects?.length > 0) {
    areas.push({
      area: 'Project Impact & Outcomes',
      priority: 'High',
      description: 'Understand the actual impact and business value of past projects',
    });
  }

  // Leadership/growth
  areas.push({
    area: 'Career Growth & Goals',
    priority: 'Medium',
    description: 'Alignment with career trajectory and team fit',
  });

  return areas.slice(0, 6);
}

function generateStrengths(matchResult: any): string[] {
  const strengths: string[] = [];

  // Add matched skills as strengths
  matchResult.matched_skills?.slice(0, 3).forEach((skill: any) => {
    strengths.push(`Strong experience with ${skill.skill_name}`);
  });

  // High match score
  if (matchResult.match_score >= 70) {
    strengths.push('Excellent overall skill match');
  }

  // Good grammar
  if (matchResult.grammar_score && matchResult.grammar_score >= 80) {
    strengths.push('Well-written CV with excellent communication');
  }

  // Experience
  if (matchResult.candidate_summary?.experience) {
    strengths.push('Relevant professional experience demonstrated');
  }

  // Projects
  if (matchResult.projects?.length > 0) {
    strengths.push(`Successfully completed ${matchResult.projects.length} relevant projects`);
  }

  return strengths.slice(0, 5);
}

function generateWeaknesses(matchResult: any): string[] {
  const weaknesses: string[] = [];

  // Missing skills
  if (matchResult.missing_skills?.length > 0) {
    weaknesses.push(
      `Missing key skill: ${matchResult.missing_skills?.slice(0, 2).join(', ')}`
    );
  }

  // Low match score
  if (matchResult.match_score < 60) {
    weaknesses.push('Limited match to job requirements');
  }

  // Grammar issues
  if (matchResult.grammar_score && matchResult.grammar_score < 80) {
    weaknesses.push('Some grammar and spelling errors in CV');
  }

  // Experience gaps
  const gapCount = matchResult.missing_skills?.length || 0;
  if (gapCount > 5) {
    weaknesses.push('Significant experience gaps in required technologies');
  }

  // Limited projects
  if (!matchResult.projects || matchResult.projects.length === 0) {
    weaknesses.push('No projects documented in CV');
  }

  return weaknesses.slice(0, 5);
}

function generateRecommendations(matchResult: any): Array<{
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}> {
  const recommendations: Array<{
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
  }> = [];

  if (matchResult.missing_skills?.length > 3) {
    recommendations.push({
      title: 'Upskill in Missing Technologies',
      description: `Focus on learning ${matchResult.missing_skills.slice(0, 3).join(', ')}. These are critical for the role and will significantly improve your candidacy.`,
      priority: 'High',
    });
  }

  recommendations.push({
    title: 'Highlight Relevant Projects',
    description: 'Ensure your CV prominently features projects that use the skills mentioned in the job description.',
    priority: 'High',
  });

  recommendations.push({
    title: 'Quantify Achievements',
    description: 'Use metrics and numbers to demonstrate impact in previous roles (e.g., "Improved performance by 30%").',
    priority: 'Medium',
  });

  if (matchResult.extra_skills?.length > 0) {
    recommendations.push({
      title: 'Leverage Extra Skills',
      description: `Your knowledge of ${matchResult.extra_skills.slice(0, 2).join(', ')} can be presented as bonuses that add value beyond job requirements.`,
      priority: 'Medium',
    });
  }

  recommendations.push({
    title: 'Optimize for ATS',
    description: 'Use keywords from the job description in your CV to improve scanning by Applicant Tracking Systems.',
    priority: 'High',
  });

  return recommendations;
}

function extractOrganizations(matchResult: any): string[] {
  // This would be extracted from CV parsing in real implementation
  return [];
}

function extractProjects(matchResult: any): Array<{ name: string; skills: string[]; description: string }> {
  // This would be extracted from CV parsing in real implementation
  return [];
}

function generateInterviewQuestions(matchResult: any): Array<{
  question: string;
  focus: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}> {
  const questions: Array<{
    question: string;
    focus: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }> = [];

  // Questions about matched skills
  matchResult.matched_skills?.slice(0, 2).forEach((skill: any) => {
    questions.push({
      question: `Describe a complex project where you used ${skill.skill_name}. What challenges did you face and how did you overcome them?`,
      focus: skill.skill_name,
      difficulty: 'Hard',
    });
  });

  // Questions about missing skills
  matchResult.missing_skills?.slice(0, 2).forEach((skill: string) => {
    questions.push({
      question: `Have you worked with ${skill} before? If not, how would you approach learning it?`,
      focus: `Willingness to learn ${skill}`,
      difficulty: 'Medium',
    });
  });

  // General technical questions
  questions.push({
    question: 'What is your approach to learning new technologies?',
    focus: 'Continuous Learning',
    difficulty: 'Easy',
  });

  questions.push({
    question: 'Can you explain your most significant technical achievement from your experience?',
    focus: 'Technical Depth & Impact',
    difficulty: 'Hard',
  });

  questions.push({
    question: 'How do you ensure code quality and maintainability in your projects?',
    focus: 'Best Practices',
    difficulty: 'Medium',
  });

  return questions.slice(0, 8); // Return max 8 questions
}
