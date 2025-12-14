"use client";

import { Box, Button, Container, Stack, Typography, TextField } from "@mui/material";
import Link from "next/link";

export default function CandidateCompletionPage() {
  return (
    <Box sx={{ bgcolor: "#f7f8fa", minHeight: "80vh", py: 4 }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Interview completed successfully
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Thank you for sharing your experience. We will replay your responses for fairness and pass it to the hiring team. Expect updates within a few days.
            </Typography>
          </Box>

          <Stack spacing={2} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 3, background: "#fff" }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              What happens next
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The company will quietly review your answers and loop in the hiring manager. We do not surface any scores or proctoring notes here.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need help? Reach out to support@assist-ten.com and we will reply within one business day.
            </Typography>
          </Stack>

          <Stack spacing={2} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 3, background: "#fff" }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Share quick feedback
            </Typography>
            <Typography variant="body2" color="text.secondary">
              How was your experience today?
            </Typography>
            <TextField variant="outlined" fullWidth placeholder="Type one sentence..." />
            <Button variant="contained" disabled>
              Submit feedback
            </Button>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component={Link} href="/candidate" variant="outlined">
              Back to home
            </Button>
            <Button component={Link} href="/candidate/support" variant="contained">
              Contact support
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
