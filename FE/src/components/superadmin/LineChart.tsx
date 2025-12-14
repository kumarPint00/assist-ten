"use client";
import React from 'react';
import ChartPlaceholder from './ChartPlaceholder';

export default function LineChart({ title, height=260 }:{ title?: string; height?: number }){
  return (
    <div style={{ minHeight: height }}>
      <ChartPlaceholder title={title || 'Interviews vs Cost (line)' } />
    </div>
  )
}
