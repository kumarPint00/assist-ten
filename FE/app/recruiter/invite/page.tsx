"use client";

import { Box, Button, Card, CardContent, Divider, Grid, Stack, TextField, Typography } from "@mui/material";

export default function RecruiterInvitePage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Invite candidate</Typography>
          <Typography variant="body2" color="text.secondary">
            Step-based form with manual and CSV entry.
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Preview and confirm before sending
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" mb={2}>
                1. Add candidate manually
              </Typography>
              <Stack spacing={2}>
                <TextField label="Candidate name" size="small" fullWidth />
                <TextField label="Candidate email" size="small" fullWidth />
                <Button variant="outlined" size="small">
                  Add candidate
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" mb={2}>
                2. Upload CSV
              </Typography>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  Drag a CSV with name/email columns or paste data.
                </Typography>
                <Button variant="text" size="small">
                  Choose file
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Placeholder for upload errors / validation warnings.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" mb={2}>
                3. Interview details
              </Typography>
              <Stack spacing={2}>
                <TextField label="Select job" size="small" fullWidth />
                <Stack direction="row" spacing={1}>
                  <TextField label="Interview type" size="small" fullWidth />
                  <TextField label="Duration" size="small" fullWidth />
                </Stack>
                <TextField label="Set deadline" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                <Divider />
                <Typography variant="subtitle2">Preview</Typography>
                <Typography variant="body2">
                  Video interview · 45 min · AI-enabled scoring. Link expires once the invitation is sent.
                </Typography>
                <Stack direction="row" spacing={1} mt={2}>
                  <Button variant="contained" size="small">
                    Send interview link
                  </Button>
                  <Button variant="outlined" size="small">
                    Save draft
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1">Outcome states</Typography>
              <Stack spacing={1} mt={1}>
                <Typography variant="body2" color="success.main">
                  ✅ Success confirmation: &ldquo;Shot sent! Candidate notified.&rdquo;
                </Typography>
                <Typography variant="body2" color="error.main">
                  ⚠️ Error placeholder: &ldquo;Unable to send link. Check email or network.&rdquo;
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
