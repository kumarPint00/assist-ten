"use client";

import { Box, Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

const jobs = [
  {
    id: 1,
    title: "Conversational AI Engineer",
    status: "Open",
    interviewTypes: "Live + Async",
    candidates: 12,
    created: "Dec 08",
  },
  {
    id: 2,
    title: "Data Platform Lead",
    status: "In progress",
    interviewTypes: "Panel",
    candidates: 5,
    created: "Nov 21",
  },
  {
    id: 3,
    title: "Security Automation Lead",
    status: "Hold",
    interviewTypes: "Async",
    candidates: 3,
    created: "Dec 01",
  },
];

export default function RecruiterJobsPage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Jobs list</Typography>
          <Typography variant="body2" color="text.secondary">
            Read-only context for active and paused roles.
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          No editing allowed — recruiter visibility only
        </Typography>
      </Stack>
      <Card variant="outlined">
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Job title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Interview type(s)</TableCell>
                  <TableCell>Number of candidates</TableCell>
                  <TableCell>Created date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Typography fontWeight={600}>{job.title}</Typography>
                    </TableCell>
                    <TableCell>{job.status}</TableCell>
                    <TableCell>{job.interviewTypes}</TableCell>
                    <TableCell>{job.candidates}</TableCell>
                    <TableCell>{job.created}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="text">
                          View job
                        </Button>
                        <Button size="small" variant="text">
                          Assessment summary
                        </Button>
                      </Stack>
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
