import React from "react";
import './CircularGauge.scss';

interface CircularGaugeProps {
  score: number; // 0-100
  size?: number; // px
  strokeWidth?: number;
  showPercent?: boolean;
}

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

const getColorBasedOnScore = (score: number) => {
  if (score >= 75) return '#10b981'; // green
  if (score >= 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

const CircularGauge: React.FC<CircularGaugeProps> = ({ score, size = 90, strokeWidth = 10, showPercent = true }) => {
  const normalizedScore = clamp(score, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;
  const color = getColorBasedOnScore(normalizedScore);

  return (
    <div className="circular-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size/2}, ${size/2})`}>
          <circle
            className="gauge-bg"
            r={radius}
            cx={0}
            cy={0}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            className="gauge-fill"
            r={radius}
            cx={0}
            cy={0}
            strokeWidth={strokeWidth}
            stroke={color}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 800ms ease-out, stroke 400ms ease' }}
          />
        </g>
      </svg>
      {showPercent && <div className="gauge-center">{Math.round(normalizedScore)}%</div>}
    </div>
  );
};

export default CircularGauge;
