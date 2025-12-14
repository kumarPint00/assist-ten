"use client";

import { useMemo } from "react";
import { Box, Button, Container, Stack, Typography, LinearProgress, Chip } from "@mui/material";

const question = {
  text: "Describe a time you simplified a process, and what the outcome was.",
  mode: "Spoken answer",
  options: [
    "Option A: Led a cross-team review",
    "Option B: Built automation for ops",
    "Option C: Documented knowledge" ,
  ],
  timer: "2:30 minutes"
};

export default function CandidateQuestionnairePage() {
  const total = 10;
  const current = 3;
  const progress = useMemo(() => (current / total) * 100, [current, total]);

  return (
    <Box sx={{ bgcolor: "#f7f8fa", minHeight: "80vh", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography variant="h4">Questionnaire</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label={`Question ${current} of ${total}`} size="small" />
              <Typography variant="body2" color="text.secondary">
                Time allotted: {question.timer}
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
          </Stack>

          <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: { xs: 3, md: 4 }, bgcolor: "#fff" }}>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.2, fontSize: 12 }}>
                {question.mode}
              </Typography>
              <Typography variant="h6">{question.text}</Typography>
              <Stack spacing={1}>
                {question.options.map((option) => (
                  <Button key={option} variant="outlined" fullWidth sx={{ justifyContent: "flex-start" }}>
                    {option}
                  </Button>
                ))}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Or speak your answer—use the mic button when ready. No scoring is shown here.
              </Typography>
              <Box
                sx={{
                  borderRadius: 2,
                  border: "1px dashed #cbd5f5",
                  p: 3,
                  minHeight: 120,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Voice answer area (mic icon would sit here in production). Speak clearly and pause if needed.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Button variant="outlined">Submit answer</Button>
            <Button variant="contained">Next question</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
