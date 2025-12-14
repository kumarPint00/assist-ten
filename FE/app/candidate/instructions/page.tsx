"use client";

import { Box, Container, Stack, Typography, Button, List, ListItem, ListItemIcon, ListItemText, Chip } from "@mui/material";
import Link from "next/link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const questionTypes = [
  { label: "Spoken", description: "Short verbal answers" },
  { label: "MCQ", description: "Multiple choice" },
  { label: "Scenario", description: "Describe what you would do" },
];

const rules = [
  "Stay on this screen until you finish the interview",
  "Avoid external help or collaboration",
  "Keep your camera on when prompted",
];

export default function CandidateInstructionsPage() {
  return (
    <Box sx={{ bgcolor: "#f7f8fa", minHeight: "80vh", py: 4 }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Interview instructions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              A quick reminder before you begin. Keep this page open, speak calmly, and enjoy the process.
            </Typography>
          </Box>

          <Stack spacing={2} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Interview format
              </Typography>
              <Chip label="Approx. 10 questions" variant="outlined" />
            </Stack>
            <List>
              {questionTypes.map((type) => (
                <ListItem key={type.label} disableGutters>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={type.label} secondary={type.description} />
                </ListItem>
              ))}
            </List>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                About 3 minutes per question. You decide how much detail to share; we want clarity, not fluff.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Basic rules
              </Typography>
              <List>
                {rules.map((rule) => (
                  <ListItem key={rule} disableGutters>
                    <ListItemIcon>
                      <CheckCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={rule} />
                  </ListItem>
                ))}
              </List>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component={Link} href="/candidate" variant="outlined">
              Back to home
            </Button>
            <Button variant="contained" size="large">
              Begin interview
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
