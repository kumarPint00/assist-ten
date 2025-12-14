"use client";

import { Box, Button, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

const jobFilters = ["AI Engineer", "Data", "Security"].map((label) => ({ label }));
const typeFilters = ["Live", "Async"].map((label) => ({ label }));
const statusFilters = ["Invited", "Started", "Completed", "Failed"].map((label) => ({ label }));

const interviews = [
  {
    id: 1,
    candidate: "Priya Das",
    job: "Conversational AI Engineer",
    type: "Live",
    status: "Started",
    duration: "42m",
  },
  {
    id: 2,
    candidate: "Miguel Ruiz",
    job: "Data Lead",
    type: "Async",
    status: "Invited",
    duration: "n/a",
  },
  {
    id: 3,
    candidate: "Lena Kline",
    job: "Operations",
    type: "Live",
    status: "Completed",
    duration: "58m",
  },
];

export default function RecruiterInterviewTrackingPage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Interview tracking</Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor live and async progress — recruiter observes only.
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Recruiter access is read-only for interviews
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
        {jobFilters.map((filter) => (
          <Chip key={filter.label} label={filter.label} variant="outlined" size="small" />
        ))}
        {typeFilters.map((filter) => (
          <Chip key={filter.label} label={filter.label} variant="filled" size="small" />
        ))}
        {statusFilters.map((filter) => (
          <Chip key={filter.label} label={filter.label} color="info" size="small" />
        ))}
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Interview type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell>{interview.candidate}</TableCell>
                    <TableCell>{interview.job}</TableCell>
                    <TableCell>{interview.type}</TableCell>
                    <TableCell>{interview.status}</TableCell>
                    <TableCell>{interview.duration}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="text">
                        View report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
