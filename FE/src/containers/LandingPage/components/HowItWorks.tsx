'use client';

import { Box, Typography } from "@mui/material";
import { SectionLayout, InfoCard, SectionTitle } from '../../../components/ui';
import { motion } from "framer-motion";
import { useState } from "react";
import "./HowItWorks.scss";

const steps = [
  {
    title: "Build a template",
    desc: "Choose a role-based template or create one with your rubrics and required competencies.",
    icon: "📋",
    details: "Customizable assessment frameworks with industry-standard competencies and skill evaluations."
  },
  {
    title: "Run interviews",
    desc: "Launch automated or live interviews — link them to stages in your hiring pipeline.",
    icon: "🎯",
    details: "Seamless integration with ATS systems and automated candidate progression through interview stages."
  },
  {
    title: "Decide with confidence",
    desc: "Scorecards, reviewer notes, and AI insights create transparent decisions and faster offers.",
    icon: "✅",
    details: "Data-driven hiring decisions with comprehensive analytics and bias-free evaluation metrics."
  },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 }
  };

  return (
    <SectionLayout id={'how-it-works'}>
      <Box className="how-it-works">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <SectionTitle>From posting to offer, in three steps.</SectionTitle>
        </motion.div>

        <motion.div
          className="how-steps"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((s, idx) => (
            <motion.div
              key={idx}
              variants={stepVariants}
              className={`how-step-wrapper ${activeStep === idx ? 'active' : ''}`}
              onMouseEnter={() => setActiveStep(idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="step-connector"
                initial={{ width: 0 }}
                whileInView={{ width: idx === steps.length - 1 ? 0 : "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: idx * 0.5 }}
              />
              <InfoCard
                title={`${idx + 1}. ${s.title}`}
                description={s.desc}
                className="how-step"
              />
              <motion.div
                className="step-icon"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                whileHover={{ scale: 1.2, rotate: 360 }}
              >
                {s.icon}
              </motion.div>
              <motion.div
                className="step-details"
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: activeStep === idx ? 1 : 0,
                  height: activeStep === idx ? "auto" : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <Typography variant="body2" className="step-detail-text">
                  {s.details}
                </Typography>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Interactive Progress Indicator */}
        <motion.div
          className="progress-indicator"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
        >
          <div className="progress-dots">
            {steps.map((_, idx) => (
              <motion.button
                key={idx}
                className={`progress-dot ${activeStep === idx ? 'active' : ''}`}
                onClick={() => setActiveStep(idx)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              />
            ))}
          </div>
          <motion.div
            className="progress-line"
            initial={{ width: 0 }}
            animate={{ width: `${(activeStep + 1) / steps.length * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>
      </Box>
    </SectionLayout>
  );
};

export default HowItWorks;
