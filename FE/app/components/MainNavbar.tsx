"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const roleNavLinks: Record<string, Array<{ label: string; href: string }>> = {
  recruiter: [
    { label: "Dashboard", href: "/recruiter/dashboard" },
    { label: "Jobs", href: "/recruiter/jobs" },
    { label: "Pipeline", href: "/recruiter/pipeline" },
  ],
  interviewer: [
    { label: "Dashboard", href: "/interviewer/dashboard" },
    { label: "Preparation", href: "/interviewer/preparation" },
    { label: "Live room", href: "/interviewer/live" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Interviews", href: "/admin/interviews" },
    { label: "Settings", href: "/admin/settings" },
  ],
  candidate: [
    { label: "Overview", href: "/candidate" },
    { label: "Assessment", href: "/candidate-assessment/preview" },
  ],
  default: [
    { label: "Dashboard", href: "/app/dashboard" },
    { label: "Recruiter", href: "/recruiter/dashboard" },
    { label: "Interviewer", href: "/interviewer/dashboard" },
    { label: "Candidate", href: "/candidate" },
    { label: "Admin", href: "/admin/dashboard" },
  ],
};

function getRole(pathname: string) {
  if (pathname.startsWith("/recruiter")) return "recruiter";
  if (pathname.startsWith("/interviewer")) return "interviewer";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/candidate")) return "candidate";
  return "default";
}

export default function MainNavbar() {
  const pathname = usePathname() || "/";
  const role = useMemo(() => getRole(pathname), [pathname]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const profileMenuOpen = Boolean(anchorEl);

  const links = roleNavLinks[role] || roleNavLinks.default;

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={1}
      sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Typography fontWeight={600}>Assist-Ten</Typography>
          <Stack component="nav" direction="row" spacing={1}>
            {links.map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                size="small"
                color={pathname.startsWith(link.href) ? "primary" : "inherit"}
              >
                {link.label}
              </Button>
            ))}
          </Stack>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: ["none", "flex"] }}>
            <IconButton color="inherit" size="small">
              <Badge badgeContent={2} color="primary">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Box>
          <Button
            onClick={handleProfileClick}
            variant="outlined"
            size="small"
            startIcon={<Avatar sx={{ width: 28, height: 28 }}>{role.charAt(0).toUpperCase()}</Avatar>}
            endIcon={<KeyboardArrowDownIcon fontSize="small" />}
          >
            {role}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={profileMenuOpen}
            onClose={handleProfileClose}
            MenuListProps={{
              "aria-labelledby": "profile-button",
            }}
          >
            <MenuItem component={Link} href="/profile-setup" onClick={handleProfileClose}>
              Manage profile
            </MenuItem>
            <MenuItem onClick={handleProfileClose}>Sign out</MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}