"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function InterviewerLiveRoomPage() {
  return (
    <Box component="main">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="flex-start" spacing={2} mb={3}>
        <Box>
          <Typography variant="h3" component="h1">
            Live interview room
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Video call layout focused on conversation, controls kept minimal.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box component="span" sx={{ typography: "caption", color: "error.main" }}>
            Recording · running
          </Box>
          <Typography variant="caption" color="text.secondary">
            Timer: 11:32
          </Typography>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ minHeight: 360 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Box
                    sx={{
                      flex: 1,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      minHeight: 150,
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Typography variant="subtitle2">Candidate video</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hanna Lewis
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Camera on · audio muted?
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      minHeight: 150,
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Typography variant="subtitle2">Your tile</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Interviewer
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Camera on · microphone on
                    </Typography>
                  </Box>
                </Stack>
                <Divider />
                <Stack direction="row" spacing={2}>
                  <Button size="small" variant="outlined">
                    Mute audio
                  </Button>
                  <Button size="small" variant="outlined">
                    Disable camera
                  </Button>
                  <Button size="small" variant="outlined">
                    Start timer
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ minHeight: 360 }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="subtitle1">Private notes</Typography>
                <Typography variant="body2" color="text.secondary">
                  Notes are saved locally until feedback is submitted.
                </Typography>
                <TextField fullWidth label="Conversation notes" multiline minRows={10} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}