"use client";

import { Box, Button, Checkbox, Container, FormControlLabel, Stack, Typography, Alert } from "@mui/material";
import { useState } from "react";

export default function CandidateConsentPage() {
  const [consent, setConsent] = useState(false);

  return (
    <Box sx={{ bgcolor: "#f7f8fa", minHeight: "80vh", py: 4 }}>
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Consent & Permissions
          </Typography>
          <Stack spacing={2}>
            <Alert severity="info">
              Audio and video are recorded during this interview solely to ensure fairness, provide proctoring, and keep a clear record. These recordings are not reviewed live unless you are in a human-led session.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              We keep things transparent: there is no hidden recording and no dark patterns. You can pause briefly before answering if you need a moment.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please grant camera and microphone permissions when prompted. They are required for video or audio interviews.
            </Typography>
          </Stack>
          <FormControlLabel
            control={<Checkbox checked={consent} onChange={(event) => setConsent(event.target.checked)} />}
            label="I understand that audio/video will be recorded for fairness and proctoring."
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Button variant="outlined" disabled>
              Request camera & mic access
            </Button>
            <Button variant="contained" size="large" disabled={!consent}>
              I Agree & Continue
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
