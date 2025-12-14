"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const questionGuide = [
  {
    id: 1,
    question: "Describe a time you resolved divergent opinions to move an AI project forward.",
    skill: "Leadership",
    prompts: ["Ask how tensions were eased", "Probe on communication style"],
  },
  {
    id: 2,
    question: "How do you balance experimentation speed and production safety in your work?",
    skill: "Judgment",
    prompts: ["Request an example", "Ask about monitoring"],
  },
  {
    id: 3,
    question: "What would you change about a recent interview you led?",
    skill: "Reflection",
    prompts: ["Listen for learning mindset", "Note how improvements are shared"],
  },
];

export default function InterviewerQuestionGuidePage() {
  return (
    <Box component="main">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="flex-start" spacing={2} mb={3}>
        <Box>
          <Typography variant="h3" component="h1">
            Interview question guide
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Structured guidance with room to skip or add your own questions.
          </Typography>
        </Box>
        <Button size="small" variant="outlined">
          Add custom question
        </Button>
      </Stack>

      <Stack spacing={2}>
        {questionGuide.map((item) => (
          <Card key={item.id} variant="outlined">
            <Accordion disableGutters elevation={0} square>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1">{item.question}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Skill focus: {item.skill}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Suggested follow-up prompts:
                  </Typography>
                  {item.prompts.map((prompt) => (
                    <Typography key={prompt} variant="body2">
                      • {prompt}
                    </Typography>
                  ))}
                  <Typography variant="caption" color="text.secondary">
                    Skip as needed.
                  </Typography>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}