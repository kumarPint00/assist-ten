"use client";
import React from 'react';

export default function ChartPlaceholder({ title }: { title?: string }) {
  return (
    <div style={{ background: '#f8fafc', height: 260, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
      {title || 'Interactive Chart Placeholder'}
    </div>
  )
}
