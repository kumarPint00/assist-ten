"use client";

import { useMemo, useState, useEffect } from "react";
import Toast from "../../components/Toast/Toast";
import { quizService } from "../../API/services";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

const PageShell = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  padding: theme.spacing(5, 3),
  backgroundColor: theme.palette.grey[100],
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
}));

export default function AssessmentCreationLayout({ children }: { children?: React.ReactNode }) {
  // Local styled helpers
  const SectionCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[1],
    marginTop: theme.spacing(2),
  }));

  const SidebarCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[1],
    position: 'sticky',
    top: theme.spacing(8),
  }));

  const WarningChip = (props: any) => <Chip color="warning" {...props} variant="outlined" />;

  // Defaults for template generation
  const DEFAULT_SKILL = 'Backend';
  const DEFAULT_LEVEL = 'Medium';

  // Component state
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<any | null>(null);
  const [overviewItems, setOverviewItems] = useState<any[]>([]);
  const [passCutoff, setPassCutoff] = useState<number>(70);
  const [editorOpen, setEditorOpen] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const strictnessLevels = ["Low", "Medium", "High"];
  const [strictness, setStrictness] = useState<string>("Medium");

  // Load a question-template from backend to replace static placeholders
  useEffect(() => {
    let mounted = true;
    const loadTemplate = async () => {
      setLoadingTemplate(true);
      try {
        const qs = await quizService.generateMCQs(DEFAULT_SKILL, DEFAULT_LEVEL);
        if (!mounted) return;
        // Create one section from the question set
        const sec = {
          id: qs.question_set_id || `qs_${Date.now()}`,
          skill: qs.skill || DEFAULT_SKILL,
          weight: 100,
          questions: qs.questions.length,
          focus: qs.level || DEFAULT_LEVEL,
        };
        const mappedQuestions = (qs.questions || []).map((q: any, idx: number) => ({
          id: q.question_id || `q_${idx}`,
          text: q.prompt || q.text || q.question || q.title || q.description || 'Question',
          type: q.type || 'MCQ',
          difficulty: q.difficulty || 'Medium',
          skill: sec.skill,
        }));

        setOverviewItems([
          { label: 'Duration', value: `${Math.max(15, Math.round((qs.questions.length * 2))) } min`, action: 'Adjust' },
          { label: 'Difficulty', value: qs.level || DEFAULT_LEVEL, action: 'Set' },
          { label: 'Interview type', value: 'AI-led', action: 'Change' },
          { label: 'Total score', value: `${qs.questions.length * 10}`, action: 'Rules' },
        ]);
        setSections([sec]);
        setQuestions(mappedQuestions);
        setActiveQuestion(mappedQuestions[0] ?? null);
        setTemplateError(null);
      } catch (err: any) {
        console.warn('Failed to load question template:', err);
        if (!mounted) return;
        setTemplateError('Could not fetch question template from server');
        // keep lists empty to show empty state
      } finally {
        if (mounted) setLoadingTemplate(false);
      }
    };
    loadTemplate();
    return () => { mounted = false; };
  }, []);

  const totalWeight = useMemo(() => sections.reduce((sum, section) => sum + (section.weight || 0), 0), [sections]);
  const weightWarning = totalWeight !== 100;

  const handleEditQuestion = (questionId: string) => {
    const question = questions.find((item) => item.id === questionId);
    setActiveQuestion(question ?? (questions.length ? questions[0] : null));
    setEditorOpen(true);
  };

  const addSection = () => {
    const id = `sec_${Date.now()}`;
    const sec = { id, skill: 'New skill', weight: 0, questions: 0, focus: 'N/A' };
    setSections((s) => [...s, sec]);
    setToast({ type: 'success', message: 'Added new section' });
  };

  const addQuestion = () => {
    const id = `q_${Date.now()}`;
    const q = { id, text: 'New question (edit)', type: 'MCQ', difficulty: 'Medium', skill: sections[0]?.skill || 'General' };
    setQuestions((qs) => [...qs, q]);
    setToast({ type: 'success', message: 'Added new question' });
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((qs) => qs.filter((q) => q.id !== questionId));
    setToast({ type: 'info', message: 'Removed question' });
  };

  const swapQuestions = (i: number, j: number) => {
    setQuestions((qs) => {
      const arr = [...qs];
      if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  const rotateSections = (sectionId: string) => {
    setSections((s) => {
      const idx = s.findIndex((sec: any) => sec.id === sectionId);
      if (idx === -1) return s;
      const arr = [...s];
      const [sec] = arr.splice(idx, 1);
      arr.push(sec);
      return arr;
    });
    setToast({ type: 'info', message: 'Moved section to end' });
  };

  const autoAdjustOrder = () => {
    // sort by difficulty: Hard > Medium > Low
    const rank = (d: string) => (d?.toLowerCase() === 'hard' ? 3 : d?.toLowerCase() === 'medium' ? 2 : 1);
    setQuestions((qs) => [...qs].sort((a, b) => rank(b.difficulty) - rank(a.difficulty)));
    setToast({ type: 'success', message: 'Auto-adjusted question order' });
  };

  const regenerateAssessment = async () => {
    setLoadingTemplate(true);
    try {
      const qs = await quizService.generateMCQs(sections[0]?.skill || 'Backend', sections[0]?.focus || 'Medium');
      const sec = { id: qs.question_set_id || `qs_${Date.now()}` , skill: qs.skill || 'Backend', weight: 100, questions: qs.questions.length, focus: qs.level || 'Medium' };
      const mapped = (qs.questions || []).map((q: any, idx: number) => ({ id: q.question_id || `q_${idx}`, text: q.prompt || q.text || 'Question', type: q.type || 'MCQ', difficulty: q.difficulty || 'Medium', skill: sec.skill }));
      setOverviewItems([{ label: 'Duration', value: `${Math.max(15, Math.round((qs.questions.length * 2))) } min`, action: 'Adjust' },{ label: 'Difficulty', value: qs.level || 'Medium', action: 'Set' },{ label: 'Interview type', value: 'AI-led', action: 'Change' },{ label: 'Total score', value: `${qs.questions.length * 10}`, action: 'Rules' }]);
      setSections([sec]);
      setQuestions(mapped);
      setToast({ type: 'success', message: 'Regenerated assessment template' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to regenerate assessment' });
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handlePreview = () => {
    if (!questions || questions.length === 0) return alert('No questions to preview');
    alert(`Previewing first question:\n\n${questions[0].text}`);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        title: `${sections[0]?.skill || 'Untitled'} Assessment`,
        description: `Generated assessment`,
        job_title: sections[0]?.skill || 'General',
        required_skills: {},
        required_roles: [],
        duration_minutes: Math.max(15, (questions.length || 1) * 2),
        is_questionnaire_enabled: true,
        is_interview_enabled: false,
      };
      const res = await (await import('../../API/services')).assessmentService.createAssessment(payload);
      setAssessmentId(res.assessment_id);
      setToast({ type: 'success', message: 'Assessment saved as draft' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to save draft' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!assessmentId) {
      await handleSaveDraft();
    }
    if (!assessmentId) return setToast({ type: 'error', message: 'No assessment to publish' });
    try {
      await (await import('../../API/services')).assessmentService.publishAssessment(assessmentId as string);
      setToast({ type: 'success', message: 'Assessment published' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to publish' });
    }
  };

  return (
    <PageShell>
      <HeaderCard>
        <Grid container spacing={2} alignItems="center">
          <Grid item sm={8}>
            <Typography variant="overline" color="text.secondary" gutterBottom>
              Assessment creation
            </Typography>
            {loadingTemplate ? (
              <>
                <Typography variant="h4">Loading template…</Typography>
                <Typography color="text.secondary">Fetching template from server</Typography>
              </>
            ) : templateError ? (
              <>
                <Typography variant="h4">Untitled assessment</Typography>
                <Typography color="text.secondary">{templateError}</Typography>
              </>
            ) : sections.length > 0 ? (
              <>
                <Typography variant="h4">{sections[0].skill} Assessment</Typography>
                <Typography color="text.secondary">Experience: {sections[0].focus || 'N/A'} · Interview: {overviewItems[2]?.value ?? 'AI-led'}</Typography>
              </>
            ) : (
              <>
                <Typography variant="h4">New assessment</Typography>
                <Typography color="text.secondary">Configure sections and questions</Typography>
              </>
            )}
          </Grid>
          <Grid item sm={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" size="small" onClick={handlePreview}>
                Preview interview
              </Button>
              <Button variant="contained" size="small" onClick={handleSaveDraft} disabled={saving}>
                {saving ? 'Saving…' : 'Save as Draft'}
              </Button>
              <Button variant="contained" size="small" color="primary" onClick={handlePublish}>
                Publish
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </HeaderCard>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SectionCard>
            <CardContent>
              <Typography variant="h6">Assessment overview</Typography>
              <Grid container spacing={2} mt={1}>
                  {loadingTemplate ? (
                    <Grid item xs={12}><LinearProgress /></Grid>
                  ) : templateError ? (
                    <Grid item xs={12}><Typography color="error">{templateError}</Typography></Grid>
                  ) : (
                    overviewItems.map((item) => (
                      <Grid key={item.label} item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="h6" mt={0.5}>
                          {item.value}
                        </Typography>
                        <Button size="small" variant="text">
                          {item.action}
                        </Button>
                      </Grid>
                    ))
                  )}
              </Grid>
              <Stack direction="row" spacing={1} mt={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Total score = {overviewItems[3]?.value ?? '100'} · Pass cutoff
                </Typography>
                <TextField
                  size="small"
                  label="Pass cutoff"
                  type="number"
                  value={passCutoff}
                  onChange={(event) => setPassCutoff(Number(event.target.value))}
                />
                {weightWarning && <WarningChip label="Weights ≠ 100" size="small" />}
              </Stack>
            </CardContent>
          </SectionCard>

          <SectionCard>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Sections</Typography>
                  <div>
                    <Button size="small" variant="outlined" onClick={addSection}>Add section</Button>
                    <Button size="small" variant="outlined" onClick={() => regenerateAssessment()} sx={{ ml: 1 }}>Regenerate template</Button>
                  </div>
              </Box>
              <Stack spacing={2} mt={2}>
                {sections.map((section) => (
                  <Card key={section.id} variant="outlined">
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6}>
                          <Typography variant="subtitle1">{section.skill}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Focus: {section.focus}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Typography variant="body2">Weight: {section.weight}%</Typography>
                            <Typography variant="body2">Questions: {section.questions}</Typography>
                            <Button size="small" variant="text" onClick={() => rotateSections(section.id)}>
                              Reorder
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </SectionCard>

          <SectionCard>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Question list</Typography>
                <Button size="small" variant="outlined" onClick={autoAdjustOrder}>
                  Auto-adjust order
                </Button>
                <Button size="small" variant="outlined" onClick={addQuestion} sx={{ ml: 1 }}>
                  Add question
                </Button>
              </Box>
              <List>
                {questions.map((question, idx) => (
                  <ListItem key={question.id} divider>
                    <Stack direction="row" spacing={2} alignItems="center" flexGrow={1}>
                      <DragIndicatorIcon />
                      <ListItemText
                        primary={question.text}
                        secondary={`Type: ${question.type} · Difficulty: ${question.difficulty} · Skill: ${question.skill}`}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" onClick={() => handleEditQuestion(question.id)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => swapQuestions(idx, Math.min(idx + 1, questions.length - 1))}>
                        <SwapHorizIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => removeQuestion(question.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </SectionCard>

          <SectionCard>
            <CardContent>
              <Typography variant="h6">Warnings & rules</Typography>
              <Stack spacing={1} mt={2}>
                <WarningChip label="Duration > 60 min" size="small" />
                <WarningChip label="Add missing skills from JD" size="small" />
              </Stack>
            </CardContent>
          </SectionCard>

          {children && (
            <SectionCard>
              <CardContent>
                <Typography variant="h6">Legacy assessment form</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  The detailed setup form is included here so administrators retain the existing workflow.
                </Typography>
                {children}
              </CardContent>
            </SectionCard>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <SidebarCard>
            <CardContent>
              <Typography variant="h6">Summary</Typography>
              <Stack spacing={1} mt={2}>
                <Typography variant="body2">Total questions: {questions.length}</Typography>
                <Typography variant="body2">Estimated duration: {overviewItems[0]?.value ?? `${Math.max(15, (questions.length || 1) * 2)} min`}</Typography>
                <Typography variant="body2">Skills: {Array.from(new Set(questions.map(q => q.skill))).filter(Boolean).join(' · ') || 'N/A'}</Typography>
                <Typography variant="body2">Difficulty spread: {(() => {
                  const counts: Record<string, number> = {};
                  questions.forEach((q) => counts[q.difficulty] = (counts[q.difficulty] || 0) + 1);
                  return Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(' · ') || 'N/A';
                })()}</Typography>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Proctoring</Typography>
              <Stack spacing={1} mt={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Audio</Typography>
                  <Switch checked={audioOn} onChange={(event) => setAudioOn(event.target.checked)} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Video</Typography>
                  <Switch checked={videoOn} onChange={(event) => setVideoOn(event.target.checked)} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Strictness
                </Typography>
                <Stack direction="row" spacing={1}>
                  {strictnessLevels.map((level) => (
                    <Chip
                      key={level}
                      label={level}
                      variant={strictness === level ? "filled" : "outlined"}
                      color={strictness === level ? "primary" : "default"}
                      onClick={() => setStrictness(level)}
                      size="small"
                    />
                  ))}
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                <Button variant="outlined" onClick={regenerateAssessment} disabled={loadingTemplate}>Regenerate assessment</Button>
                <Button variant="contained" onClick={handlePublish}>Publish assessment</Button>
              </Stack>
            </CardContent>
          </SidebarCard>
        </Grid>
      </Grid>

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <Drawer anchor="right" open={editorOpen} onClose={() => setEditorOpen(false)}>
        <Box width={420} p={3} role="presentation">
          <Typography variant="h6" gutterBottom>
            Question editor
          </Typography>
          <TextField
            label="Question"
            multiline
            minRows={3}
            fullWidth
            defaultValue={activeQuestion?.text}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Expected answer outline"
            multiline
            minRows={3}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Evaluation criteria"
            multiline
            minRows={2}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField label="Follow-up trigger" fullWidth helperText="Select outcome that prompts branching" />
          <Stack direction="row" spacing={1} justifyContent="flex-end" mt={3}>
            <Button size="small" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button size="small" variant="contained">
              Save question
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </PageShell>
  );
}
