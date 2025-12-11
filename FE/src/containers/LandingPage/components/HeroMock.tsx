import React from 'react';
import { Box, Typography } from '@mui/material';
import './HeroSection.scss';

const HeroMock = () => {
  return (
    <div className="mock-collage">
      <div className="mock-dashboard">Dashboard preview</div>
      <div className="mock-interview">Live interviewer</div>
      <div className="mock-scorecard">Scorecard</div>
    </div>
  );
};

export default HeroMock;
