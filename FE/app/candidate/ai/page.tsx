"use client";

import { Box, Container, Typography, Stack, Button, LinearProgress, Chip } from "@mui/material";
import Link from "next/link";

const followUps = [
  "Tell us about a time you asked for help.",
  "How would you explain this to a teammate?",
];

export default function CandidateAIInterviewPage() {
  return (
    <Box sx={{ bgcolor: "#f7f8fa", minHeight: "80vh", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Typography variant="h4">AI-led interview</Typography>
          <Typography variant="body2" color="text.secondary">
            A voice-only assistant will ask the questions. You simply listen, then answer aloud. No avatar, just calm audio.
          </Typography>

          <Stack spacing={2} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 3, bgcolor: "#fff" }}>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.3 }}>
              Question 1 of 4
            </Typography>
            <Typography variant="h6">Describe how you keep feedback loops short with your team.</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label="Voice-only question" color="primary" />
              <Typography variant="caption" color="text.secondary">
                Playback indicator: • AI speaking
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={65} sx={{ height: 6, borderRadius: 3 }} />
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#ef4444",
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Recording in progress
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                Timer: 00:38
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Candidate camera preview (small), microphone meter, and recording lights would appear here in the product.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Respond verbally when the tone changes to a subtle chime. There may be optional follow-up prompts.
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Optional follow-up questions
              </Typography>
              {followUps.map((prompt) => (
                <Typography variant="body2" key={prompt} color="text.secondary">
                  • {prompt}
                </Typography>
              ))}
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component={Link} href="/candidate/questionnaire" variant="outlined">
              Switch to questionnaire
            </Button>
            <Button variant="contained">Finish response</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
