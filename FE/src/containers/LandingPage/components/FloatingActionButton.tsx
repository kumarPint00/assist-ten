'use client';

import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import './FloatingActionButton.scss';

const FloatingActionButton = () => {
  const scrollToDemo = () => {
    const el = document.getElementById("demo");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fab-container"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ delay: 2, type: "spring", stiffness: 200 }}
      >
        <Tooltip title="Watch Demo" placement="left">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Fab
              color="primary"
              className="demo-fab"
              onClick={scrollToDemo}
              size="large"
            >
              <PlayArrowIcon />
            </Fab>
          </motion.div>
        </Tooltip>

        {/* Animated rings */}
        <motion.div
          className="fab-ring fab-ring-1"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="fab-ring fab-ring-2"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.2, 0, 0.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingActionButton;