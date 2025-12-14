"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const skillSections = ["Communication", "Problem solving", "Teamwork", "Adaptability"];
const recommendationOptions = ["Strong yes", "Yes", "No", "Strong no"];

export default function InterviewerFeedbackPage() {
  return (
    <Box component="main">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="flex-start" spacing={2} mb={3}>
        <Box>
          <Typography variant="h3" component="h1">
            Interview feedback
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Editable until submission · no AI scores shown.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined">
            Save draft
          </Button>
          <Button size="small" variant="contained">
            Submit feedback
          </Button>
        </Stack>
      </Stack>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Skill-wise rating
          </Typography>
          <Stack spacing={2}>
            {skillSections.map((skill) => (
              <FormControl key={skill}>
                <FormLabel>{skill}</FormLabel>
                <RadioGroup row>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <FormControlLabel
                      key={`${skill}-${value}`}
                      value={value.toString()}
                      control={<Radio size="small" />}
                      label={value.toString()}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2} mb={3}>
        <TextField fullWidth label="Overall impression" multiline minRows={2} />
        <TextField fullWidth label="Strengths" multiline minRows={2} />
        <TextField fullWidth label="Concerns" multiline minRows={2} />
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <FormControl>
            <FormLabel>Recommendation</FormLabel>
            <RadioGroup row>
              {recommendationOptions.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio size="small" />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>
    </Box>
  );
}