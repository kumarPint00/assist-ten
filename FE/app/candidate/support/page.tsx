"use client";

import { Box, Container, Typography, Stack, Button, TextField } from "@mui/material";
import Link from "next/link";

export default function CandidateSupportPage() {
  return (
    <Box sx={{ bgcolor: "#f7f8fa", minHeight: "80vh", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Typography variant="h4">Support</Typography>
          <Typography variant="body1" color="text.secondary">
            Need help? Use the form or return to the home screen. Keep all language plain and reassuring.
          </Typography>
          <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 3 }}>            
            <TextField label="Describe your issue" fullWidth multiline rows={3} variant="outlined" />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              We will respond via the email that received this link.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="outlined" component={Link} href="/candidate">
              Back to home
            </Button>
            <Button variant="contained">Send support request</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
