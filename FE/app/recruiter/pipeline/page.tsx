"use client";

import { Box, Button, Card, CardContent, Chip, Divider, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

const filters = ["All jobs", "AI Engineer", "Data Lead", "Security"].map((label) => ({ label }));
const statuses = ["Needs review", "Interviewing", "Awaiting", "Shortlisted"];

const pipeline = [
  {
    id: 1,
    candidate: "Priya Das",
    job: "Conversational AI Engineer",
    status: "Needs review",
    score: "-",
    proctoring: "Clean",
    invited: "Dec 10",
  },
  {
    id: 2,
    candidate: "Miguel Ruiz",
    job: "Data Lead",
    status: "Interviewing",
    score: "83",
    proctoring: "Warning",
    invited: "Dec 02",
  },
  {
    id: 3,
    candidate: "Lena Kline",
    job: "Ops Manager",
    status: "Awaiting",
    score: "-",
    proctoring: "Clean",
    invited: "Dec 11",
  },
];

export default function RecruiterPipelinePage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={3}>
        <Box>
          <Typography variant="h4">Candidate pipeline</Typography>
          <Typography variant="body2" color="text.secondary">
            Filterable table + bulk actions for outreach.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small">
            Bulk invite
          </Button>
          <Button variant="outlined" size="small">
            Bulk shortlist
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
        {filters.map((filter) => (
          <Chip key={filter.label} label={filter.label} variant="outlined" size="small" />
        ))}
        {statuses.map((status) => (
          <Chip key={status} label={status} size="small" />
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
                  <TableCell>Interview status</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Proctoring status</TableCell>
                  <TableCell>Invitation date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pipeline.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.candidate}</TableCell>
                    <TableCell>{row.job}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.score}</TableCell>
                    <TableCell>{row.proctoring}</TableCell>
                    <TableCell>{row.invited}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="text">
                          View
                        </Button>
                        <Button size="small" variant="text">
                          Send link
                        </Button>
                        <Button size="small" variant="text">
                          Resend
                        </Button>
                        <Button size="small" variant="text">
                          Shortlist
                        </Button>
                        <Button size="small" variant="text">
                          Reject
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
