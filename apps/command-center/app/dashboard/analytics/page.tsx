"use client";

import { useState, useEffect } from "react";
import styles from "./analytics.module.css";

const STATUS_BARS = [
  { label: "Available", value: 35, max: 50, color: "#4caf50" },
  { label: "On-Duty", value: 40, max: 50, color: "#42a5f5" },
  { label: "Retired", value: 5, max: 50, color: "#ef5350" },
];

// Simulated time-series data for downloads/performance chart
const CHART_DATA = [
  { month: "Jan", value: 12 }, { month: "Feb", value: 18 },
  { month: "Mar", value: 15 }, { month: "Apr", value: 28 },
  { month: "May", value: 22 }, { month: "Jun", value: 35 },
  { month: "Jul", value: 45 }, { month: "Aug", value: 38 },
  { month: "Sep", value: 42 }, { month: "Oct", value: 55 },
  { month: "Nov", value: 48 }, { month: "Dec", value: 62 },
];

export default function AnalyticsPage() {
  const [section, setSection] = useState("all");
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);
  }, []);

  const maxValue = Math.max(...CHART_DATA.map((d) => d.value));
  const chartHeight = 200;
  const chartWidth = 600;

  // Generate SVG line chart path
  const points = CHART_DATA.map((d, i) => {
    const x = (i / (CHART_DATA.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (d.value / maxValue) * (chartHeight - 40) - 20;
    return `${x},${y}`;
  });
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${chartWidth - 20},${chartHeight - 20} L 20,${chartHeight - 20} Z`;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Analytics</h2>
        <select value={section} onChange={(e) => setSection(e.target.value)} className={styles.sectionSelect} id="analytics-section">
          <option value="all">Section List ▾</option>
          <option value="101">Section 101</option>
          <option value="102">Section 102</option>
          <option value="201">Section 201</option>
          <option value="202">Section 202</option>
        </select>
      </div>

      {/* Worker Status Bars */}
      <div className={`glass-card ${styles.statusCard}`}>
        <h3 className={styles.cardTitle}>Worker&apos;s Status</h3>
        <div className={styles.statusBars}>
          {STATUS_BARS.map((bar) => (
            <div key={bar.label} className={styles.barRow}>
              <span className={styles.barLabel}>{bar.label}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: animated ? `${(bar.value / bar.max) * 100}%` : "0%",
                    background: bar.color,
                  }}
                />
              </div>
              <span className={styles.barValue}>{bar.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line Chart */}
      <div className={`glass-card ${styles.chartCard}`}>
        <h3 className={styles.cardTitle}>Performance Over Time</h3>
        <div className={styles.chartWrapper}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={styles.chart}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = chartHeight - pct * (chartHeight - 40) - 20;
              return (
                <line
                  key={pct}
                  x1="20" y1={y}
                  x2={chartWidth - 20} y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Area gradient */}
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c62828" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#c62828" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#areaGrad)" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#c62828"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={animated ? styles.lineAnimated : ""}
            />

            {/* Dots */}
            {CHART_DATA.map((d, i) => {
              const x = (i / (CHART_DATA.length - 1)) * (chartWidth - 40) + 20;
              const y = chartHeight - (d.value / maxValue) * (chartHeight - 40) - 20;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#c62828" stroke="#050508" strokeWidth="2" />
                  <text x={x} y={chartHeight - 2} textAnchor="middle" fill="#8888a0" fontSize="9">
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
