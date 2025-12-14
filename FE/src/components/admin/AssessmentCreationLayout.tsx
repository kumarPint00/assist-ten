"use client";

import { useMemo, useState } from "react";
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
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const SectionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  marginBottom: theme.spacing(2),
}));

const SidebarCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  position: "sticky",
  top: theme.spacing(4),
}));

const WarningChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.light,
  color: theme.palette.error.contrastText,
  fontWeight: 600,
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

const overviewItems = [
  { label: "Duration", value: "45 min", action: "Adjust" },
  { label: "Difficulty", value: "Medium", action: "Set" },
  { label: "Interview type", value: "AI-led", action: "Change" },
  { label: "Total score", value: "100", action: "Rules" },
];

const sections = [
  { id: "problem-solving", skill: "Problem solving", weight: 35, questions: 3, focus: "Scenario" },
  { id: "communication", skill: "Communication", weight: 25, questions: 2, focus: "Spoken" },
  { id: "domain", skill: "Domain expertise", weight: 40, questions: 4, focus: "Case" },
];

const questions = [
  {
    id: "q1",
    text: "Walk me through a time you resolved a production issue within strict SLAs.",
    type: "Scenario",
    difficulty: "Medium",
    skill: "Problem solving",
  },
  {
    id: "q2",
    text: "Explain how you would architect a multi-region API with disaster recovery.",
    type: "MCQ",
    difficulty: "Hard",
    skill: "Domain expertise",
  },
  {
    id: "q3",
    text: "Describe a project where you coached another engineer through a tough design decision.",
    type: "Spoken",
    difficulty: "Medium",
    skill: "Communication",
  },
];

const questionTypes = ["MCQ", "Spoken", "Scenario", "Case"];
const strictnessLevels = ["Low", "Medium", "High"];

interface AssessmentCreationLayoutProps {
  children?: React.ReactNode;
}

export default function AssessmentCreationLayout({ children }: AssessmentCreationLayoutProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(questions[0]);
  const [audioOn, setAudioOn] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [strictness, setStrictness] = useState("Medium");
  const [passCutoff, setPassCutoff] = useState(65);

  const totalWeight = useMemo(() => sections.reduce((sum, section) => sum + section.weight, 0), []);
  const weightWarning = totalWeight !== 100;

  const handleEditQuestion = (questionId: string) => {
    const question = questions.find((item) => item.id === questionId);
    setActiveQuestion(question ?? questions[0]);
    setEditorOpen(true);
  };

  return (
    <PageShell>
      <HeaderCard>
        <Grid container spacing={2} alignItems="center">
          <Grid item sm={8}>
            <Typography variant="overline" color="text.secondary" gutterBottom>
              Assessment creation
            </Typography>
            <Typography variant="h4">Senior Backend Engineer · Platform Risk</Typography>
            <Typography color="text.secondary">Experience: 5+ years · Interview: AI-led (custom review)</Typography>
          </Grid>
          <Grid item sm={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" size="small">
                Preview interview
              </Button>
              <Button variant="contained" size="small">
                Save as Draft
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
                {overviewItems.map((item) => (
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
                ))}
              </Grid>
              <Stack direction="row" spacing={1} mt={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Total score = 100 · Pass cutoff
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
                <Button size="small" variant="outlined">
                  Add section
                </Button>
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
                            <Button size="small" variant="text">
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
                <Button size="small" variant="outlined">
                  Auto-adjust order
                </Button>
              </Box>
              <List>
                {questions.map((question) => (
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
                      <IconButton size="small">
                        <SwapHorizIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
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
                <Typography variant="body2">Estimated duration: 48 min</Typography>
                <Typography variant="body2">Skills: Problem solving · Domain expertise · Communication</Typography>
                <Typography variant="body2">Difficulty spread: 2 Medium · 1 Hard</Typography>
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
                <Button variant="outlined">Regenerate assessment</Button>
                <Button variant="contained">Publish assessment</Button>
              </Stack>
            </CardContent>
          </SidebarCard>
        </Grid>
      </Grid>

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
