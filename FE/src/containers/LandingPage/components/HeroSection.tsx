'use client';

import { Box, Typography } from "@mui/material";
import { PrimaryButton } from '../../../components/ui';
import { SectionLayout } from '../../../components/ui';
import { useEffect, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import HeroMock from './HeroMock';
import "./HeroSection.scss";
import { useNavigate } from "../../../hooks/navigation";

const HeroSection = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [teamCount, setTeamCount] = useState(0);
  const [speedCount, setSpeedCount] = useState(0);

  const fullText = "Make every interview decisive.";
  const typingSpeed = 100;
  const pauseTime = 2000;

  useEffect(() => {
    setToken(localStorage.getItem("authToken"));
  }, []);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (currentIndex < fullText.length && isTyping) {
      const timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    } else if (currentIndex === fullText.length && isTyping) {
      setTimeout(() => {
        setIsTyping(false);
        setCurrentIndex(0);
      }, pauseTime);
    } else if (!isTyping && currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, fullText.length - currentIndex - 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed / 2);
      return () => clearTimeout(timeout);
    } else if (!isTyping && currentIndex === fullText.length) {
      setTimeout(() => {
        setIsTyping(true);
        setCurrentIndex(0);
      }, 500);
    }
  }, [currentIndex, isTyping, fullText]);

  // Counter animation
  useEffect(() => {
    const animateCounter = (target: number, setter: (value: number) => void, duration: number = 2000) => {
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(current));
        }
      }, 16);

      return () => clearInterval(timer);
    };

    const timer1 = setTimeout(() => animateCounter(500, setTeamCount), 1000);
    const timer2 = setTimeout(() => animateCounter(42, setSpeedCount), 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 30px rgba(59, 43, 238, 0.3)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  return (
    <SectionLayout id="hero">
      <Box className="hero">
        {/* Animated background particles */}
        {isClient && (
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                  opacity: 0
                }}
                animate={{
                  y: [null, -100],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          className="hero-inner"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Box className="hero-left">
            <motion.div variants={itemVariants}>
              <Typography variant="h3" className="hero-title">
                {displayText}
                <span className="cursor">|</span>
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Typography variant="body1" className="hero-subtitle">
                Automated interviewer, consistent scoring, and secure workflows —
                so teams hire faster and with more confidence.
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants} className="hero-ctas">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
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
              </motion.div>

              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
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
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="hero-micro">
              <span>Used by</span>
              <motion.strong
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                {teamCount}+ teams
              </motion.strong>
              <span>• Avg. screen-to-offer</span>
              <motion.strong
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                {speedCount}% faster
              </motion.strong>
            </motion.div>
          </Box>

          <motion.div
            className="hero-right"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <HeroMock />
          </motion.div>
        </motion.div>
      </Box>
    </SectionLayout>
  );
};

export default HeroSection;
