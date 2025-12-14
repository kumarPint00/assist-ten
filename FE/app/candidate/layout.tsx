"use client";

import React, { ReactNode } from "react";
import { Box } from "@mui/material";
import CandidateSidebarNav from "../../src/components/CandidateSidebarNav/CandidateSidebarNav";
import "./layout.scss";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <Box className="candidate-dashboard">
      <CandidateSidebarNav />
      <Box className="candidate-main">{children}</Box>
    </Box>
  );
}
