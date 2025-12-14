"use client";

import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";

export default function InterviewerCompletionPage() {
  return (
    <Box component="main">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="flex-start" spacing={2} mb={3}>
        <Box>
          <Typography variant="h3" component="h1">
            Interview completion
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Close the interview with a clear confirmation message.
          </Typography>
        </Box>
        <Button size="small" variant="contained">
          Back to dashboard
        </Button>
      </Stack>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Interview completed</Typography>
            <Typography variant="body2" color="text.secondary">
              Confirmation sent to operations. Feedback submission status: draft saved.
            </Typography>
            <Typography variant="body2">
              Next steps:
            </Typography>
            <Stack component="ul" spacing={1} sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                Submit feedback if anything changed before finalizing.
              </Typography>
              <Typography component="li" variant="body2">
                Return to dashboard to pick up the next interviewer assignment.
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}