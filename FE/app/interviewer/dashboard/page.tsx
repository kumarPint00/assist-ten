"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const todayInterviews = [
  { candidate: "Aditi Roy", job: "AI Product Lead", time: "09:00 AM", status: "On deck" },
  { candidate: "Jonah Bates", job: "Security ML Engineer", time: "10:30 AM", status: "Video ready" },
];

const upcomingInterviews = [
  { candidate: "Mina Patel", job: "Conversational Designer", time: "01:00 PM", status: "Pre-interview brief sent" },
  { candidate: "Luis Grant", job: "Data Ops Specialist", time: "03:15 PM", status: "Awaiting candidate" },
];

const inProgressInterviews = [
  {
    candidate: "Priya Das",
    job: "Applied Scientist",
    time: "11:20 AM",
    status: "In progress",
  },
  {
    candidate: "Miguel Ruiz",
    job: "Data Lead",
    time: "12:45 PM",
    status: "Panel joined",
  },
];

const completedPendingFeedback = [
  {
    candidate: "Lena Kline",
    job: "Operations Manager",
    time: "Yesterday, 04:15 PM",
    status: "Feedback pending",
  },
  {
    candidate: "Ravi Shah",
    job: "Platform Architect",
    time: "Yesterday, 05:30 PM",
    status: "Awaiting comments",
  },
];

export default function InterviewerDashboardPage() {
  return (
    <Box component="main">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="flex-start" spacing={2} mb={4}>
        <Box>
          <Typography variant="h3" component="h1">
            Interviewer dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assigned interviews only · focus on what is ready now.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined">
            View calendar
          </Button>
          <Button size="small" variant="contained">
            Join next interview
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1">Upcoming interviews (today)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Assigned to you
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {todayInterviews.map((interview) => (
                  <Box key={interview.candidate}>
                    <Typography variant="body1" fontWeight={600}>
                      {interview.candidate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {interview.job} · {interview.time} · {interview.status}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1">Upcoming interviews (next)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Only assigned slots
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {upcomingInterviews.map((interview) => (
                  <Box key={interview.candidate}>
                    <Typography variant="body1" fontWeight={600}>
                      {interview.candidate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {interview.job} · {interview.time} · {interview.status}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">Interviews in progress</Typography>
            <Typography variant="caption" color="text.secondary">
              Ready to join
            </Typography>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Candidate name</TableCell>
                  <TableCell>Job title</TableCell>
                  <TableCell>Interview type</TableCell>
                  <TableCell>Scheduled time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inProgressInterviews.map((interview) => (
                  <TableRow key={interview.candidate}>
                    <TableCell>{interview.candidate}</TableCell>
                    <TableCell>{interview.job}</TableCell>
                    <TableCell>Human</TableCell>
                    <TableCell>{interview.time}</TableCell>
                    <TableCell>{interview.status}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined">
                          Join interview
                        </Button>
                        <Button size="small" variant="text">
                          View details
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

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">Completed interviews pending feedback</Typography>
            <Typography variant="caption" color="text.secondary">
              Submit impressions
            </Typography>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Candidate name</TableCell>
                  <TableCell>Job title</TableCell>
                  <TableCell>Interview type</TableCell>
                  <TableCell>Scheduled time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {completedPendingFeedback.map((interview) => (
                  <TableRow key={interview.candidate}>
                    <TableCell>{interview.candidate}</TableCell>
                    <TableCell>{interview.job}</TableCell>
                    <TableCell>Human</TableCell>
                    <TableCell>{interview.time}</TableCell>
                    <TableCell>{interview.status}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" disabled>
                          Join interview
                        </Button>
                        <Button size="small" variant="text">
                          View details
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