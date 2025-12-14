"use client";

import { Box, Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";

const preparationDetails = {
  candidate: "Hanna Lewis",
  job: "Human Factors Researcher",
  experience: "8 years",
  duration: "45 minutes",
  format: "Human-led conversation",
};

const readOnlySections = [
  {
    title: "Job summary",
    content:
      "Assess behavioral fit for a human-centered design team focused on AI safety products. Look for adaptability in ambiguous requirements.",
  },
  {
    title: "Key skills to assess",
    content: "Systems thinking, communication under pressure, and translating research insights into actionable steps.",
  },
  {
    title: "Suggested focus areas",
    content:
      "Probe decision-making in remote collaborations, comfort with stakeholder interviews, and ability to influence design trade-offs.",
  },
  {
    title: "Interview guidelines",
    content:
      "Keep the conversation experiential. Listen first, then pivot to scenario-based questions. Capture impressions in the post-interview form.",
  },
];

export default function InterviewerPreparationPage() {
  return (
    <Box component="main">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="flex-start" spacing={2} mb={3}>
        <Box>
          <Typography variant="h3" component="h1">
            Interview preparation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Context before joining the human-led interview.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined">
            Mark as unavailable
          </Button>
          <Button size="small" variant="contained">
            Join interview
          </Button>
        </Stack>
      </Stack>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="subtitle1">Candidate context</Typography>
            <Typography variant="h5" component="div" fontWeight={600}>
              {preparationDetails.candidate}
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Typography variant="body2">{preparationDetails.job}</Typography>
              <Typography variant="body2">Experience: {preparationDetails.experience}</Typography>
              <Typography variant="body2">Duration: {preparationDetails.duration}</Typography>
              <Typography variant="body2">Format: {preparationDetails.format}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {readOnlySections.map((section) => (
          <Card key={section.title} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {section.content}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}