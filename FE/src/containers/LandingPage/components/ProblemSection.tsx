'use client';

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { SectionLayout, InfoCard, SectionTitle } from '../../../components/ui';
import { useEffect, useState } from 'react';
import "./ProblemSection.scss";

const items = [
  {
    title: "Inconsistent evaluation",
    desc: "Interviews vary with each interviewer — scoring, questions, and outcomes differ without standardized rubrics.",
    icon: "⚖️",
    color: "#ef4444"
  },
  {
    title: "Slow screening",
    desc: "Manual scheduling, individual reviews, and fragmented tools stretch hiring timelines.",
    icon: "⏱️",
    color: "#f59e0b"
  },
  {
    title: "Low signal",
    desc: "Hard to compare candidates and find the right fit without consistent metrics.",
    icon: "📊",
    color: "#8b5cf6"
  },
];

const ProblemSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
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
    <SectionLayout id="problems">
      <Box className="problem-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <SectionTitle>Interviews are inconsistent, slow, and noisy.</SectionTitle>
        </motion.div>

        <motion.div
          className="problem-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{
                scale: 1.05,
                y: -8,
                transition: { duration: 0.2 }
              }}
              className="problem-card-wrapper"
            >
              <InfoCard
                title={item.title}
                description={item.desc}
                className="problem-card"
                icon={item.icon}
                accentColor={item.color}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="problem-cta"
        >
          <Typography className="problem-subtitle">
            That&apos;s why we built a platform that eliminates these pain points entirely.
          </Typography>
        </motion.div>
      </Box>
    </SectionLayout>
  );
};

export default ProblemSection;
