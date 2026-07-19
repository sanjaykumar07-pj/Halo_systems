"use client";

import { useState } from "react";
import styles from "./section.module.css";

const SECTIONS = [
  { id: 101, name: "Section 101", gate: "A", floor: 1, capacity: 800, occupancy: 720, noise: 85, accessible: true },
  { id: 102, name: "Section 102", gate: "A", floor: 1, capacity: 800, occupancy: 690, noise: 80, accessible: true },
  { id: 103, name: "Section 103", gate: "B", floor: 1, capacity: 600, occupancy: 580, noise: 90, accessible: true },
  { id: 104, name: "Section 104", gate: "B", floor: 1, capacity: 600, occupancy: 540, noise: 75, accessible: false },
  { id: 105, name: "Section 105", gate: "C", floor: 1, capacity: 500, occupancy: 480, noise: 70, accessible: true },
  { id: 201, name: "Section 201", gate: "A", floor: 2, capacity: 1000, occupancy: 950, noise: 95, accessible: true },
  { id: 202, name: "Section 202", gate: "B", floor: 2, capacity: 1000, occupancy: 880, noise: 88, accessible: true },
  { id: 203, name: "Section 203", gate: "C", floor: 2, capacity: 800, occupancy: 720, noise: 82, accessible: false },
  { id: 204, name: "Section 204", gate: "D", floor: 2, capacity: 800, occupancy: 760, noise: 78, accessible: true },
  { id: 301, name: "Section 301", gate: "A", floor: 3, capacity: 600, occupancy: 450, noise: 60, accessible: true },
  { id: 302, name: "Section 302", gate: "B", floor: 3, capacity: 600, occupancy: 500, noise: 65, accessible: true },
  { id: 303, name: "Section 303", gate: "C", floor: 3, capacity: 400, occupancy: 350, noise: 55, accessible: true },
];

export default function SectionPage() {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  const selected = SECTIONS.find((s) => s.id === selectedSection);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Stadium Map</h2>
        <div className={styles.viewToggle}>
          <button className={`${styles.toggleBtn} ${viewMode === "map" ? styles.active : ""}`} onClick={() => setViewMode("map")} aria-label="Switch to Map View">Map</button>
          <button className={`${styles.toggleBtn} ${viewMode === "list" ? styles.active : ""}`} onClick={() => setViewMode("list")} aria-label="Switch to List View">List</button>
        </div>
      </div>

      {viewMode === "map" ? (
        <div className={`glass-card ${styles.mapCard}`}>
          {/* SVG Stadium Map */}
          <svg viewBox="0 0 800 500" className={styles.stadiumSvg}>
            {/* Stadium outline */}
            <ellipse cx="400" cy="250" rx="380" ry="230" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <ellipse cx="400" cy="250" rx="300" ry="170" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
            <ellipse cx="400" cy="250" rx="200" ry="110" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

            {/* Pitch/Field */}
            <rect x="250" y="170" width="300" height="160" rx="8" fill="rgba(76,175,80,0.08)" stroke="rgba(76,175,80,0.2)" strokeWidth="1" />
            <line x1="400" y1="170" x2="400" y2="330" stroke="rgba(76,175,80,0.15)" strokeWidth="1" />
            <circle cx="400" cy="250" r="30" fill="none" stroke="rgba(76,175,80,0.15)" strokeWidth="1" />
            <text x="400" y="255" textAnchor="middle" fill="rgba(76,175,80,0.3)" fontSize="12">PITCH</text>

            {/* Section blocks — positioned around the stadium */}
            {SECTIONS.map((section) => {
              const angle = ((section.id % 100) - 1) * (360 / 5) * (Math.PI / 180);
              const tier = section.floor;
              const radius = 200 + tier * 60;
              const x = 400 + Math.cos(angle - Math.PI / 2) * radius * 0.85;
              const y = 250 + Math.sin(angle - Math.PI / 2) * radius * 0.55;
              const occupancyPct = section.occupancy / section.capacity;
              const fillColor = occupancyPct > 0.9 ? "rgba(239,83,80,0.3)"
                : occupancyPct > 0.7 ? "rgba(255,167,38,0.3)"
                : "rgba(76,175,80,0.3)";
              const isSelected = selectedSection === section.id;

              return (
                <g 
                  key={section.id} 
                  onClick={() => setSelectedSection(section.id)} 
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSection(section.id);
                    }
                  }}
                  style={{ cursor: "pointer", outline: "none" }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View Section ${section.id}, ${Math.round(occupancyPct * 100)}% occupancy`}
                >
                  <rect
                    x={x - 30}
                    y={y - 18}
                    width="60"
                    height="36"
                    rx="6"
                    fill={isSelected ? "rgba(198,40,40,0.3)" : fillColor}
                    stroke={isSelected ? "#c62828" : "rgba(255,255,255,0.1)"}
                    strokeWidth={isSelected ? 2 : 1}
                    className={styles.sectionBlock}
                  />
                  <text x={x} y={y - 3} textAnchor="middle" fill="#f0f0f5" fontSize="8" fontWeight="600">
                    {section.id}
                  </text>
                  <text x={x} y={y + 9} textAnchor="middle" fill="#8888a0" fontSize="7">
                    {Math.round(occupancyPct * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Gate labels */}
            {["A", "B", "C", "D"].map((gate, i) => {
              const angle = (i * 90) * (Math.PI / 180);
              const x = 400 + Math.cos(angle - Math.PI / 2) * 370;
              const y = 250 + Math.sin(angle - Math.PI / 2) * 220;
              return (
                <text key={gate} x={x} y={y} textAnchor="middle" fill="#c62828" fontSize="12" fontWeight="700">
                  Gate {gate}
                </text>
              );
            })}
          </svg>

          {/* Section Detail Panel */}
          {selected && (
            <div className={styles.detailPanel}>
              <h3>{selected.name}</h3>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}><span>Gate</span><strong>{selected.gate}</strong></div>
                <div className={styles.detailItem}><span>Floor</span><strong>{selected.floor}</strong></div>
                <div className={styles.detailItem}><span>Capacity</span><strong>{selected.capacity}</strong></div>
                <div className={styles.detailItem}><span>Occupancy</span><strong>{selected.occupancy}</strong></div>
                <div className={styles.detailItem}><span>Noise Level</span><strong>{selected.noise}dB</strong></div>
                <div className={styles.detailItem}><span>Accessible</span><strong>{selected.accessible ? "✅ Yes" : "❌ No"}</strong></div>
              </div>
              <div className={styles.occupancyBar}>
                <div className={styles.occFill} style={{ width: `${(selected.occupancy / selected.capacity) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`glass-card ${styles.listCard}`}>
          <table>
            <thead>
              <tr>
                <th className={styles.th}>Section</th>
                <th className={styles.th}>Gate</th>
                <th className={styles.th}>Floor</th>
                <th className={styles.th}>Capacity</th>
                <th className={styles.th}>Occupancy</th>
                <th className={styles.th}>Noise</th>
                <th className={styles.th}>Accessible</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((s) => (
                <tr 
                  key={s.id} 
                  className={styles.tr} 
                  onClick={() => { setSelectedSection(s.id); setViewMode("map"); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSection(s.id);
                      setViewMode("map");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for Section ${s.id}`}
                >
                  <td className={styles.td}>{s.name}</td>
                  <td className={styles.td}>{s.gate}</td>
                  <td className={styles.td}>{s.floor}</td>
                  <td className={styles.td}>{s.capacity}</td>
                  <td className={styles.td}>{s.occupancy}</td>
                  <td className={styles.td}>{s.noise}dB</td>
                  <td className={styles.td}>{s.accessible ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
