"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Typography } from "@mui/material";
import "./CandidateSidebarNav.scss";

const navItems = [
  { label: "Home", href: "/candidate" },
  { label: "System check", href: "/candidate/system" },
  { label: "Consent", href: "/candidate/consent" },
  { label: "Instructions", href: "/candidate/instructions" },
  { label: "Questionnaire", href: "/candidate/questionnaire" },
  { label: "AI interview", href: "/candidate/ai" },
  { label: "Live interview", href: "/candidate/human" },
  { label: "Support", href: "/candidate/support" },
];

export default function CandidateSidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="candidate-sidebar">
      <Box className="candidate-brand">
        <Typography variant="h6" component="p">
          Candidate space
        </Typography>
        <Typography variant="caption">Interview journey</Typography>
      </Box>
      <nav className="candidate-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`candidate-nav-link${isActive ? " active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Box className="candidate-note">
        <Typography variant="caption">
          One-click access • Audio + video recorded for fairness • No internal scores visible here.
        </Typography>
      </Box>
    </aside>
  );
}
