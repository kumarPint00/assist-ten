"use client";

import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from "@mui/material";

const thread = [
  {
    id: 1,
    author: "Recruiter — Ayesha",
    time: "08:45",
    text: "Candidate Priya is confident but needs prompt feedback to keep momentum.",
  },
  {
    id: 2,
    author: "Hiring manager — Arun",
    time: "09:12",
    text: "Please prioritize cloud networking questions in the panel.",
  },
  {
    id: 3,
    author: "Recruiter — Ayesha",
    time: "11:00",
    text: "Panel completed; waiting for live notes before sharing summary.",
  },
];

export default function RecruiterNotesPage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Notes & collaboration</Typography>
          <Typography variant="body2" color="text.secondary">
            Internal timelines and comments.
          </Typography>
        </Box>
        <Button size="small" variant="outlined">
          Add note
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            {thread.map((note) => (
              <Box key={note.id}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">{note.author}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {note.time}
                  </Typography>
                </Stack>
                <Typography variant="body2">{note.text}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Actions: Edit own note
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Simple input area
          </Typography>
          <Stack spacing={1} mt={1}>
            <TextField label="Add a note" size="small" fullWidth multiline rows={2} />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" variant="text">
                Cancel
              </Button>
              <Button size="small" variant="contained">
                Post note
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
