"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function CandidateEmailComposer() {
  const [candidateName, setCandidateName] = useState("Aditi Rao");
  const [candidateEmail, setCandidateEmail] = useState("aditi.rao@assist.ai");
  const [role, setRole] = useState("Product Developer");
  const [message, setMessage] = useState(
    "We noticed your background in platform development and would like to invite you to complete a short skills assessment. The results will help our recruiters match you to the right hiring team."
  );
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const emailSubject = useMemo(() => `You're invited to the ${role} skills assessment`, [role]);
  const candidateLink = useMemo(() => `/candidate-assessment/preview`, []);

  const handleSend = () => {
    setSent(true);
  };

  const handleCopyLink = () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(`${origin}${candidateLink}`);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Invite candidate by email</Typography>
            <Typography variant="body2" color="text.secondary">
              Draft a personalized invite and share the assessment link directly with the candidate.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Candidate Name"
              value={candidateName}
              onChange={(event) => setCandidateName(event.target.value)}
              fullWidth
            />
            <TextField
              label="Email address"
              type="email"
              value={candidateEmail}
              onChange={(event) => setCandidateEmail(event.target.value)}
              fullWidth
            />
          </Stack>

          <TextField
            label="Target role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            fullWidth
          />

          <TextField
            label="Message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            fullWidth
            minRows={3}
            multiline
          />

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Email preview
            </Typography>
            <Card variant="outlined" sx={{ mt: 1, p: 2, bgcolor: "background.paper" }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {emailSubject}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Hi {candidateName.split(" ")[0] || candidateName},
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {message}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Click below to get started with the assessment and learn how your skills match the role.
              </Typography>
              <Button
                size="small"
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleCopyLink}
                startIcon={<ContentCopyIcon />}
              >
                Copy assessment link
              </Button>
              {copied && (
                <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                  Link copied
                </Typography>
              )}
            </Card>
          </Box>

          <Divider />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="contained" color="primary" fullWidth onClick={handleSend}>
              Send invite
            </Button>
            <Button variant="outlined" color="primary" fullWidth>
              Save draft
            </Button>
          </Stack>

          {sent && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Invite queued for {candidateEmail}. Candidate will see a dedicated landing page with the link.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
