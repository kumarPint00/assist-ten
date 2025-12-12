'use client';

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { SectionTitle, SectionLayout, InfoCard } from '../../../components/ui';
import "./ProductFeaturesSection.scss";

const features = [
  {
    title: "Automated Interview Engine",
    desc: "Structured, customizable interviews that run on-demand or live to keep screening consistent and fast.",
    icon: "🤖",
    color: "#6366f1",
    category: "Automation"
  },
  {
    title: "Consistent Scoring & Review",
    desc: "Rubrics and automated scoring reduce subjectivity; reviewers re-score with a single tweak.",
    icon: "📊",
    color: "#f59e0b",
    category: "Intelligence"
  },
  {
    title: "Real-Time AI Assistance",
    desc: "AI suggests follow-ups, clarifies answers, and provides candidate insights for better decisions.",
    icon: "🧠",
    color: "#10b981",
    category: "AI-Powered"
  },
  {
    title: "Integrations & Workflow Sync",
    desc: "One-click sync with ATS, calendar, and communication tools — updates arrive where your team works.",
    icon: "🔗",
    color: "#8b5cf6",
    category: "Integration"
  },
  {
    title: "Proctoring & Identity Verification",
    desc: "Automated proctoring and identity checks for remote interviews with clear privacy and audit trails.",
    icon: "🔒",
    color: "#ef4444",
    category: "Security"
  },
  {
    title: "Enterprise Security & Controls",
    desc: "SSO, RBAC, audit logging, and regional data residency options to meet compliance requirements.",
    icon: "🛡️",
    color: "#06b6d4",
    category: "Compliance"
  },
];

const ProductFeaturesSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  };

  return (
    <SectionLayout id="features">
      <Box className="product-features">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <SectionTitle>What a modern interview platform should do</SectionTitle>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{
                scale: 1.03,
                y: -8,
                transition: { duration: 0.2 }
              }}
              className="feature-card-wrapper"
            >
              <InfoCard
                title={feature.title}
                description={feature.desc}
                className="feature-card"
                icon={feature.icon}
                accentColor={feature.color}
                category={feature.category}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="features-showcase"
        >
          <Box className="showcase-stats">
            <Box className="stat">
              <Typography className="stat-value">85%</Typography>
              <Typography className="stat-desc">Faster hiring</Typography>
            </Box>
            <Box className="stat">
              <Typography className="stat-value">3x</Typography>
              <Typography className="stat-desc">More consistent</Typography>
            </Box>
            <Box className="stat">
              <Typography className="stat-value">50%</Typography>
              <Typography className="stat-desc">Bias reduction</Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </SectionLayout>
  );
};

export default ProductFeaturesSection;
