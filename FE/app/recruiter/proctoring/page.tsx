"use client";

import { Box, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Typography } from "@mui/material";

const incidents = [
  { id: 1, type: "Face mismatch", severity: "High", status: "Flagged", timestamp: "09:22" },
  { id: 2, type: "Tab switch", severity: "Medium", status: "Warning", timestamp: "09:45" },
  { id: 3, type: "Muted camera", severity: "Low", status: "Clean", timestamp: "10:12" },
];

export default function RecruiterProctoringPage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Proctoring summary</Typography>
          <Typography variant="body2" color="text.secondary">
            Awareness-only feed for compliance.
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Read-only; no override actions
        </Typography>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Violation type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>{incident.type}</TableCell>
                    <TableCell>
                      <Chip
                        label={incident.severity}
                        size="small"
                        color={incident.severity === "High" ? "error" : incident.severity === "Medium" ? "warning" : "success"}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={incident.status} size="small" />
                    </TableCell>
                    <TableCell>{incident.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" mb={1}>
            Detail view (candidate context)
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">Candidate: Priya Das · Interview type: Video (AI review)</Typography>
            <Typography variant="body2">Notes: System flagged multiple face mismatches; review recommended.</Typography>
            <Typography variant="body2" color="text.secondary">
              No controls are exposed — visible notes only.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
