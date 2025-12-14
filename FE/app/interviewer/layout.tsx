"use client";

import { ReactNode } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import Link from "next/link";

const sections = [
  { label: "Dashboard", href: "/interviewer/dashboard" },
  { label: "Interview preparation", href: "/interviewer/preparation" },
  { label: "Live room", href: "/interviewer/live" },
  { label: "Question guide", href: "/interviewer/questions" },
  { label: "Feedback", href: "/interviewer/feedback" },
  { label: "Completion", href: "/interviewer/completion" },
  { label: "History", href: "/interviewer/history" },
];

export default function InterviewerLayout({ children }: { children: ReactNode }) {
  return (
    <Box component="section" sx={{ display: "flex", minHeight: "100vh" }}>
      <Box
        sx={{
          width: 240,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          px: 3,
          py: 4,
        }}
      >
        <Typography variant="overline" color="text.secondary" mb={2} display="block">
          Interviewer workspace
        </Typography>
        <Stack spacing={1}>
          {sections.map((section) => (
            <Link key={section.href} href={section.href} style={{ textDecoration: "none" }}>
              <Typography variant="body2" color="text.primary" sx={{ cursor: "pointer" }}>
                {section.label}
              </Typography>
            </Link>
          ))}
        </Stack>
        <Divider sx={{ my: 3 }} />
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            Support
          </Typography>
          <Typography variant="caption" fontWeight={600}>
            interviewer@assist10.com
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>{children}</Box>
    </Box>
  );
}