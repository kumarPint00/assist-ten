"use client";

import { Button, Container, Stack, Typography, Box, Chip, Divider } from "@mui/material";
import { useSearchParams } from "next/navigation";

type LandingDetails = {
  company: string;
  role: string;
  message: string;
  mode: string;
  duration: string;
  deadline?: string;
};

const landingInfo: LandingDetails = {
  company: "Assist Ten",
  role: "Product Developer (Platform team)",
  message: "We appreciate your time. Everything recorded here is used only to make the process fair for everyone.",
  mode: "Questionnaire + Guided interview",
  duration: "~30 minutes",
  deadline: "Complete by Dec 18, 2025",
};

const HighlightRow = ({ label, value }: { label: string; value: string }) => (
  <Stack direction="row" justifyContent="space-between">
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {value}
    </Typography>
  </Stack>
);

export default function CandidateLandingPage() {
  const searchParams = useSearchParams();
  const candidateName = searchParams?.get("name") || "Candidate";
  const role = searchParams?.get("role") || landingInfo.role;

  return (
    <Box sx={{ minHeight: "80vh", background: "#f7f8fa", py: 4 }}>
      <Container maxWidth="md">
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
            p: { xs: 3, md: 5 },
          }}
        >
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: "#e0e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                }}
              >
                AT
              </Box>
              <Stack>
                <Typography variant="subtitle2" sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
                  {landingInfo.company}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Welcome {candidateName.split(" ")[0]}
                </Typography>
              </Stack>
            </Stack>

            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {role}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {landingInfo.message}
              </Typography>
            </Box>

            <Stack spacing={2}>
              <HighlightRow label="Interview type" value={landingInfo.mode} />
              <HighlightRow label="Estimated duration" value={landingInfo.duration} />
              {landingInfo.deadline && <HighlightRow label="Deadline" value={landingInfo.deadline} />}
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Button variant="contained" size="large">
                Start Interview
              </Button>
              <Chip label="No login required • No account setup • Just take it at your pace" color="primary" />
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
