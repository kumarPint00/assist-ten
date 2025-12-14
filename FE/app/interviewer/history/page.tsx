"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const historyRecords = [
  { candidate: "Priya Das", job: "Applied Scientist", date: "Nov 12", status: "Submitted" },
  { candidate: "Miguel Ruiz", job: "Data Lead", date: "Nov 10", status: "Submitted" },
  { candidate: "Lena Kline", job: "Operations Manager", date: "Nov 03", status: "Pending" },
  { candidate: "Ravi Shah", job: "Platform Architect", date: "Oct 28", status: "Submitted" },
];

export default function InterviewerHistoryPage() {
  return (
    <Box component="main">
      <Typography variant="h3" component="h1" mb={1}>
        Interview history
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Read-only record of your completed interviews; no scoring exposed.
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Candidate name</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Feedback status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyRecords.map((record) => (
                  <TableRow key={record.candidate + record.date}>
                    <TableCell>{record.candidate}</TableCell>
                    <TableCell>{record.job}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.status}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="text">
                        View feedback
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