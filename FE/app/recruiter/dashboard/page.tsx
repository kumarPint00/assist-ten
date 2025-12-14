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

const summaryCards = [
  { title: "Candidates requiring action", value: "14", note: "Awaiting feedback" },
  { title: "Interviews scheduled today", value: "6", note: "Last session 5:30pm" },
  { title: "Completed interviews pending review", value: "5", note: "Add notes before EOD" },
  { title: "Shortlisted candidates", value: "8", note: "For offer discussion" },
];

const tasks = [
  {
    id: 1,
    task: "Send tech interview link to Priya",
    job: "AI Engineer • Priya",
    due: "by 10:00",
    action: "Remind candidate",
  },
  {
    id: 2,
    task: "Log feedback for Miguel",
    job: "Data Lead • M2K",
    due: "by 11:30",
    action: "Add note",
  },
  {
    id: 3,
    task: "Share completion summary with ops",
    job: "Platform Architect",
    due: "assigned",
    action: "Send summary",
  },
];

const interviewsRemaining = [
  { time: "3:00 PM", candidate: "Ayesha N.", status: "Awaiting start" },
  { time: "3:45 PM", candidate: "Ravi S.", status: "Confirming video" },
  { time: "4:30 PM", candidate: "Leon T.", status: "Ready" },
];

const recentActivity = [
  { id: 1, candidate: "Priya Das", job: "Conversational AI Engineer", status: "Needs review", lastUpdate: "09:05" },
  { id: 2, candidate: "Miguel Ruiz", job: "Data Lead", status: "Interview ended", lastUpdate: "10:15" },
  { id: 3, candidate: "Lena Kline", job: "Ops Manager", status: "Feedback submitted", lastUpdate: "11:02" },
  { id: 4, candidate: "Neha P.", job: "Security Lead", status: "Panel scheduled", lastUpdate: "11:45" },
];

export default function RecruiterDashboardPage() {
  return (
    <Box component="main" px={{ xs: 2, md: 4 }} py={{ xs: 3, md: 5 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h3" component="h1">
            Recruiter control center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Today’s hiring pulse across AI interview rounds.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small">
            Invite candidate
          </Button>
          <Button variant="outlined" size="small">
            Start interview
          </Button>
          <Button variant="contained" size="small">
            Confirm shortlist
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} mb={4}>
        {summaryCards.map((card) => (
          <Grid item xs={12} md={3} key={card.title}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="h4" component="div" mb={1}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.note}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">Actionable task list</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="text">
                    Today
                  </Button>
                  <Button size="small" variant="text">
                    This week
                  </Button>
                </Stack>
              </Stack>
              <Stack spacing={2}>
                {tasks.map((task) => (
                  <Card key={task.id} variant="outlined" sx={{ borderColor: "divider" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {task.task}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.job} · due {task.due}
                          </Typography>
                        </Box>
                        <Button size="small" variant="outlined">
                          {task.action}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" mb={1}>
                Interviews remaining (read-only)
              </Typography>
              <Stack spacing={1}>
                {interviewsRemaining.map((interview) => (
                  <Stack key={interview.time} direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="body1">{interview.candidate}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {interview.time}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {interview.status}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" mb={2}>
            Recent activity
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last update</TableCell>
                  <TableCell align="right">Quick action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentActivity.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2" component="span" fontWeight={600}>
                        {item.candidate}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.job}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.lastUpdate}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="contained">
                        Review feedback
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
