'use client';

import { Box, Typography } from "@mui/material";
import { PrimaryButton } from '../../../components/ui';
import { SectionLayout, lazyImport } from '../../../components/ui';
import { useEffect, useState } from "react";
import "./HeroSection.scss";
import { useNavigate } from "../../../hooks/navigation";

const HeroSection = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const HeroMock = lazyImport(() => import('./HeroMock'));

  useEffect(() => {
    setToken(localStorage.getItem("authToken"));
  }, []);

  return (
    <SectionLayout id="hero">
      <Box className="hero">
        <Box className="hero-inner">
        <Box className="hero-left">
          <Typography variant="h3" className="hero-title">
            Make every interview decisive.
          </Typography>

          <Typography variant="body1" className="hero-subtitle">
            Automated interviewer, consistent scoring, and secure workflows —
            so teams hire faster and with more confidence.
          </Typography>

          <Box className="hero-ctas">
            <PrimaryButton
              variant="contained"
              className="hero-btn"
              onClick={() => {
                const el = document.getElementById("demo");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                else navigate("/demo");
              }}
            >
              Request demo
            </PrimaryButton>

            <PrimaryButton
              variantStyle={'outline'}
              className="hero-btn-ghost"
              onClick={() => {
                const el = document.getElementById("pricing");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                else navigate("/signup");
              }}
            >
              Start free trial
            </PrimaryButton>
          </Box>

          <Box className="hero-micro">
            <span>Used by</span>
            <strong>500+ teams</strong>
            <span>• Avg. screen-to-offer 42% faster</span>
          </Box>
        </Box>

        <Box className="hero-right">
          <HeroMock />
        </Box>
        </Box>
      </Box>
    </SectionLayout>
  );
};

export default HeroSection;
