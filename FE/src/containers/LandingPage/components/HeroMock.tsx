import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import './HeroSection.scss';

const HeroMock = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const tabs = [
    { id: 0, title: 'Dashboard', content: 'Real-time analytics & insights' },
    { id: 1, title: 'Live Interview', content: 'AI-powered conversation flow' },
    { id: 2, title: 'Smart Scoring', content: 'Automated evaluation metrics' }
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, tabs.length]);

  const mockVariants = {
    dashboard: {
      scale: 1,
      rotateY: 0,
      zIndex: activeTab === 0 ? 3 : 1,
      transition: { duration: 0.5 }
    },
    interview: {
      scale: activeTab === 1 ? 1.05 : 0.95,
      rotateY: activeTab === 1 ? 0 : -5,
      zIndex: activeTab === 1 ? 3 : 2,
      transition: { duration: 0.5 }
    },
    scorecard: {
      scale: activeTab === 2 ? 1.05 : 0.95,
      rotateY: activeTab === 2 ? 0 : 5,
      zIndex: activeTab === 2 ? 3 : 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="mock-container">
      <motion.div
        className="mock-collage"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Dashboard Card */}
        <motion.div
          className="mock-card mock-dashboard"
          variants={mockVariants}
          animate="dashboard"
          whileHover={{ scale: 1.05, rotateY: 0 }}
          onClick={() => setActiveTab(0)}
        >
          <div className="card-header">
            <div className="card-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="card-title">Dashboard</div>
          </div>
          <div className="card-content">
            <div className="chart-placeholder">
              <motion.div
                className="chart-bar"
                initial={{ height: 0 }}
                animate={{ height: activeTab === 0 ? '60%' : '40%' }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              <motion.div
                className="chart-bar"
                initial={{ height: 0 }}
                animate={{ height: activeTab === 0 ? '80%' : '60%' }}
                transition={{ duration: 1, delay: 0.7 }}
              />
              <motion.div
                className="chart-bar"
                initial={{ height: 0 }}
                animate={{ height: activeTab === 0 ? '45%' : '30%' }}
                transition={{ duration: 1, delay: 0.9 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Interview Card */}
        <motion.div
          className="mock-card mock-interview"
          variants={mockVariants}
          animate="interview"
          whileHover={{ scale: 1.05, rotateY: 0 }}
          onClick={() => setActiveTab(1)}
        >
          <div className="card-header">
            <div className="card-title">Live Interview</div>
          </div>
          <div className="card-content">
            <div className="interview-interface">
              <motion.div
                className="avatar"
                animate={{
                  scale: activeTab === 1 ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: activeTab === 1 ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                🤖
              </motion.div>
              <motion.div
                className="message-bubble"
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: activeTab === 1 ? 1 : 0.5,
                  y: activeTab === 1 ? 0 : 5
                }}
                transition={{ duration: 0.5 }}
              >
                Tell me about your experience with React...
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scorecard Card */}
        <motion.div
          className="mock-card mock-scorecard"
          variants={mockVariants}
          animate="scorecard"
          whileHover={{ scale: 1.05, rotateY: 0 }}
          onClick={() => setActiveTab(2)}
        >
          <div className="card-header">
            <div className="card-title">Scorecard</div>
          </div>
          <div className="card-content">
            <div className="score-metrics">
              <motion.div
                className="metric"
                initial={{ width: 0 }}
                animate={{ width: activeTab === 2 ? '85%' : '60%' }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <span>Technical: 85%</span>
              </motion.div>
              <motion.div
                className="metric"
                initial={{ width: 0 }}
                animate={{ width: activeTab === 2 ? '92%' : '70%' }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <span>Communication: 92%</span>
              </motion.div>
              <motion.div
                className="metric"
                initial={{ width: 0 }}
                animate={{ width: activeTab === 2 ? '78%' : '55%' }}
                transition={{ duration: 1, delay: 0.7 }}
              >
                <span>Problem Solving: 78%</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Interactive Controls */}
      <div className="mock-controls">
        <IconButton
          onClick={() => setIsPlaying(!isPlaying)}
          className="play-pause-btn"
          size="small"
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        <div className="tab-indicators">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              className={`tab-indicator ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="tab-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Typography variant="body2" className="tab-title">
            {tabs[activeTab].title}
          </Typography>
          <Typography variant="caption" className="tab-description">
            {tabs[activeTab].content}
          </Typography>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HeroMock;
