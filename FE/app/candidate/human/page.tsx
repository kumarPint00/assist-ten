"use client";

import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function CandidateHumanInterviewPage() {
  return (
    <Box sx={{ bgcolor: "#f7f8fa", minHeight: "80vh", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Typography variant="h4">Live interview</Typography>
          <Typography variant="body2" color="text.secondary">
            Join the video call with your interviewer. We record quietly in the background for fairness—no scores are shown here.
          </Typography>

          <Stack spacing={2} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, bgcolor: "#fff", p: { xs: 3, md: 4 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Video interface
              </Typography>
              <Chip label="Recording" color="error" size="small" />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="stretch">
              <Box
                sx={{
                  border: "1px solid #d1d5db",
                  borderRadius: 2,
                  flex: 1,
                  minHeight: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f3f4f6",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Candidate video preview
                </Typography>
              </Box>
              <Box
                sx={{
                  border: "1px dashed #cbd5f5",
                  borderRadius: 2,
                  flex: 1,
                  minHeight: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Interviewer video preview with subtle status lights
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined">Mute</Button>
              <Button variant="outlined">Turn off camera</Button>
              <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
                Recording silently captures the session
              </Typography>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component={Link} href="/candidate" variant="outlined">
              Back to home
            </Button>
            <Button variant="contained">End session</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
