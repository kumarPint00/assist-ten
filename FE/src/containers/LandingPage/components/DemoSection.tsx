"use client";
import { Box, Typography } from "@mui/material";
import { SectionLayout, PrimaryButton } from '../../../components/ui';
import "./DemoSection.scss";

const DemoSection = () => {
  return (
    <SectionLayout id={'demo'}>
      <Box className="demo-section">
        <Box className="demo-inner">
          <Box className="demo-left">
            <Typography variant="h4" className="demo-title">
              See it in action
            </Typography>
            <Typography className="demo-desc">
              Schedule a 15-minute walkthrough or try our interactive sandbox — no signup required.
            </Typography>
            <Box className="demo-ctas">
              <PrimaryButton onClick={() => { const el = document.getElementById('hero'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>Request demo</PrimaryButton>
              <PrimaryButton variantStyle='outline' onClick={() => { const el = document.getElementById('pricing'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>Try the sandbox</PrimaryButton>
            </Box>
          </Box>

          <Box className="demo-right">
            <div className="sandbox-placeholder">Interactive sandbox preview</div>
          </Box>
        </Box>
      </Box>
    </SectionLayout>
  );
};

export default DemoSection;
