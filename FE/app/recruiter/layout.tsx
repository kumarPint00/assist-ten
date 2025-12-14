"use client";

import { ReactNode } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import Link from "next/link";

const sections = [
  { label: "Dashboard", href: "/recruiter/dashboard" },
  { label: "Jobs list", href: "/recruiter/jobs" },
  { label: "Pipeline", href: "/recruiter/pipeline" },
  { label: "Invite", href: "/recruiter/invite" },
  { label: "Interview tracking", href: "/recruiter/interviews" },
  { label: "Results", href: "/recruiter/results" },
  { label: "Proctoring", href: "/recruiter/proctoring" },
  { label: "Notes", href: "/recruiter/notes" },
];

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  return (
    <Box component="section" sx={{ display: "flex", minHeight: "100vh" }}>
      <Box
        sx={{
          width: 220,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          px: 2,
          py: 4,
        }}
      >
        <Typography variant="overline" color="text.secondary" mb={2} display="block">
          Recruiter Console
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
            Need quick help?
          </Typography>
          <Typography variant="caption" fontWeight={600}>
            support@assist10.com
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>{children}</Box>
    </Box>
  );
}
