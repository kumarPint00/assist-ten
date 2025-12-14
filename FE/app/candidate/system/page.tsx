"use client";

import { Box, Button, Card, Chip, Container, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const checks = [
  { label: "Camera preview", status: "success", detail: "Face is centered and lighting is good" },
  { label: "Microphone level", status: "success", detail: "Speaking clearly at 55% volume" },
  { label: "Internet connection", status: "success", detail: "Stable 65 Mbps up/down" },
  { label: "Browser compatibility", status: "warning", detail: "Chrome 118 is recommended" },
];

const statusColors: Record<string, "success" | "error" | "warning"> = {
  success: "success",
  warning: "warning",
  error: "error",
};

export default function CandidateSystemPage() {
  const allGreen = checks.every((check) => check.status === "success");

  return (
    <Box sx={{ bgcolor: "#f7f8fa", minHeight: "80vh", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              System check
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Run these quick technical checks so the interview runs smoothly. No score is shown here—just a thumbs-up when each check completes.
            </Typography>
          </Box>

          <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: "1px solid #e0e7ff" }}>
            <Box
              sx={{
                borderRadius: 2,
                border: "1px dashed #cbd5f5",
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body1">Camera preview shows you here.</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Check your camera and lighting. It auto-refreshes every 3 seconds.
            </Typography>
          </Card>

          <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Microphone level
                </Typography>
                <Chip label="Live" color="primary" size="small" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Speak into the mic. The indicator below should show movement when you talk.
              </Typography>
              <Box sx={{ border: "1px solid #cbd5f5", borderRadius: 2, p: 2 }}>
                <Box
                  sx={{
                    width: "100%",
                    height: 8,
                    background: "rgba(59, 130, 246, 0.15)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: "55%",
                      height: "100%",
                      background: "#2563eb",
                      transition: "width 0.3s ease",
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Current level: 55% (ideal range 40-70%).
                </Typography>
              </Box>
            </Stack>
          </Card>

          <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <Stack spacing={2}>
              {checks.map((check) => (
                <Stack key={check.label} spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1">{check.label}</Typography>
                    <Chip label={check.status.toUpperCase()} color={statusColors[check.status]} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {check.detail}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Button variant="outlined">Retry checks</Button>
            <Button variant="contained" endIcon={<ArrowForwardIcon />} disabled={!allGreen}>
              Continue to interview
            </Button>
            {!allGreen && (
              <Typography variant="caption" color="text.secondary">
                Fix any warnings (e.g., browser version) to proceed.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
