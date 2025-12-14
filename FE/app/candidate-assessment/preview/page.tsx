import { Box, Button, Card, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function CandidateAssessmentPreviewPage() {
  return (
    <Box sx={{ minHeight: "80vh", bgcolor: "#f4f6fb", py: 8 }}>
      <Container maxWidth="sm">
        <Card sx={{ p: 4, borderRadius: 3, textAlign: "center", boxShadow: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={600}>
              Candidate assessment preview
            </Typography>
            <Typography color="text.secondary">
              This is a placeholder experience to show what the candidate will see when they land on their assessment link. The real assessment will fetch the matching job context and questions from the platform.
            </Typography>
            <Typography color="text.secondary">
              When production data is available, the candidate will continue from this screen into the timed assessment workflow.
            </Typography>
            <Button component={Link} href="/candidate" variant="contained">
              Back to candidate welcome
            </Button>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
