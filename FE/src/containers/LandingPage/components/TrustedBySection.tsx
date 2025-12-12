'use client';

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { SectionLayout, SectionTitle } from '../../../components/ui';
import "./TrustedBySection.scss";

const MotionDiv = motion.div;

const logos = [
  "/assets/logos/company1.svg",
  "/assets/logos/company2.svg",
  "/assets/logos/company3.svg",
  "/assets/logos/company4.svg",
  "/assets/logos/company5.svg",
];

const TrustedBySection = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0
    }
  };

  return (
    <SectionLayout id={'trusted-by'}>
      <Box className="trusted-by">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <SectionTitle>Trusted by hiring teams at scale</SectionTitle>
        </MotionDiv>

        <MotionDiv
          className="logos"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {logos.map((logo, i) => (
            <MotionDiv
              key={i}
              variants={logoVariants}
              whileHover={{
                scale: 1.1,
                y: -8,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
              className="logo-wrapper"
            >
              <img
                src={logo}
                alt={`Company logo ${i + 1}`}
                className="trusted-logo"
                loading="lazy"
              />
            </MotionDiv>
          ))}
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="trust-stats"
        >
          <Box className="stat-item">
            <Typography className="stat-number">500+</Typography>
            <Typography className="stat-label">Companies</Typography>
          </Box>
          <Box className="stat-item">
            <Typography className="stat-number">50K+</Typography>
            <Typography className="stat-label">Interviews</Typography>
          </Box>
          <Box className="stat-item">
            <Typography className="stat-number">99.9%</Typography>
            <Typography className="stat-label">Uptime</Typography>
          </Box>
        </MotionDiv>
      </Box>
    </SectionLayout>
  );
};

export default TrustedBySection;
