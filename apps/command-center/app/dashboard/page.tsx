"use client";

import { useState, useEffect } from "react";
import styles from "./dashboard.module.css";
import { getDashboardStats, getWorkers } from "../lib/supabase";

const STAT_CARDS = [
  { key: "active_workers",   label: "Active Workers",   color: "#4caf50" },
  { key: "incident_workers", label: "Incident Workers", color: "#ff9800" },
  { key: "total_problems",   label: "Total Problems",   color: "#42a5f5" },
  { key: "problem_solved",   label: "Problem Solved",   color: "#ab47bc" },
  { key: "efficiency",       label: "Efficiency",       color: "#ef5350", suffix: "%" },
];

type FilterType = "all" | "janitor" | "medic" | "security";
type FilterStatus = "all" | "on-duty" | "completed" | "off-duty" | "retired";

export default function DashboardPage() {
  const [stats, setStats] = useState({ active_workers: 0, incident_workers: 0, total_problems: 0, problem_solved: 0, efficiency: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    async function loadData() {
      try {
        const [s, w] = await Promise.all([getDashboardStats(), getWorkers()]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStats(s as any);
        setWorkers(w ?? []);
      } catch (e) {
        console.error("Supabase load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredWorkers = workers.filter((w) => {
    if (filterType !== "all" && w.type !== filterType) return false;
    if (filterStatus !== "all" && w.status !== filterStatus) return false;
    return true;
  });

  // Build status chart data from live workers
  const statusCounts = workers.reduce<Record<string, number>>((acc, w) => {
    acc[w.status] = (acc[w.status] ?? 0) + 1;
    return acc;
  }, {});
  const STATUS_DATA = [
    { label: "On-Duty",   count: statusCounts["on-duty"]   ?? 0, color: "#4caf50" },
    { label: "Completed", count: statusCounts["completed"] ?? 0, color: "#42a5f5" },
    { label: "Off-Duty",  count: statusCounts["off-duty"]  ?? 0, color: "#ffa726" },
    { label: "Retired",   count: statusCounts["retired"]   ?? 0, color: "#ef5350" },
  ];
  const total = STATUS_DATA.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div className={styles.page}>
      {/* ─── Filters ───────────────────────────────────── */}
      <div className={styles.filtersRow}>
        <span className={styles.filtersLabel}>Filters:</span>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)} className={styles.filterSelect} id="filter-worker-type">
          <option value="all">Worker&apos;s Type ▾</option>
          <option value="janitor">Janitor</option>
          <option value="medic">Medic</option>
          <option value="security">Security</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterStatus)} className={styles.filterSelect} id="filter-status">
          <option value="all">Status: All ▾</option>
          <option value="on-duty">On-Duty</option>
          <option value="completed">Completed</option>
          <option value="off-duty">Off-Duty</option>
          <option value="retired">Retired</option>
        </select>
        {!loading && <span className={styles.liveTag}>🟢 Live</span>}
      </div>

      {/* ─── Stat Cards ────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((card, i) => (
          <div key={card.key} className={`glass-card ${styles.statCard} ${mounted ? "animate-fade-in" : ""}`} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className={styles.statIconCircle} style={{ background: `${card.color}18`, borderColor: `${card.color}40` }}>
              <div className={styles.statDot} style={{ background: card.color }} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{card.label}</span>
              <span className={styles.statValue}>
                {loading ? "—" : (stats as Record<string, number>)[card.key]}
                {!loading && (card.suffix ?? "")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Content Grid ─────────────────────────── */}
      <div className={styles.mainGrid}>
        {/* Recent Workers Table */}
        <div className={`glass-card ${styles.tableCard}`}>
          <h3 className={styles.cardTitle}>
            Recent Workers
            <span className={styles.rowCount}>{filteredWorkers.length} workers</span>
          </h3>
          {loading ? (
            <div className={styles.loadingRows}>
              {[...Array(5)].map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th className={styles.th}>ID</th>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Type</th>
                    <th className={styles.th}>Section</th>
                    <th className={styles.th}>Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.slice(0, 10).map((worker) => (
                    <tr key={worker.worker_id} className={styles.tr}>
                      <td className={styles.td}>{worker.worker_id}</td>
                      <td className={styles.td}>{worker.name}</td>
                      <td className={styles.td}><span className={`badge badge-${worker.status}`}>{worker.status}</span></td>
                      <td className={styles.td} style={{ textTransform: "capitalize" }}>{worker.type}</td>
                      <td className={styles.td}>{worker.section}</td>
                      <td className={styles.td}>
                        <div className={styles.efficiencyBar}>
                          <div className={styles.efficiencyFill} style={{ width: `${worker.efficiency}%` }} />
                          <span className={styles.efficiencyText}>{worker.efficiency}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Workers Status Chart */}
        <div className={`glass-card ${styles.chartCard}`}>
          <h3 className={styles.cardTitle}>Workers Status</h3>
          <div className={styles.stackedBar}>
            {STATUS_DATA.map((s) => (
              <div key={s.label} className={styles.stackedSegment} style={{ width: `${(s.count / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.count}`} />
            ))}
          </div>
          <div className={styles.legend}>
            {STATUS_DATA.map((s) => (
              <div key={s.label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: s.color }} />
                <span className={styles.legendLabel}>{s.label}</span>
                <span className={styles.legendCount}>{loading ? "—" : s.count}</span>
              </div>
            ))}
          </div>
          <div className={styles.donutWrapper}>
            <svg viewBox="0 0 120 120" className={styles.donut}>
              {STATUS_DATA.reduce<{ elements: React.ReactElement[]; offset: number }>(
                (acc, s, i) => {
                  const pct = (s.count / total) * 100;
                  const circumference = 2 * Math.PI * 50;
                  const strokeLength = (pct / 100) * circumference;
                  acc.elements.push(
                    <circle key={i} cx="60" cy="60" r="50" fill="none" stroke={s.color} strokeWidth="10"
                      strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                      strokeDashoffset={-acc.offset} strokeLinecap="round"
                      style={{ transition: "all 0.8s ease" }}
                    />
                  );
                  acc.offset += strokeLength;
                  return acc;
                },
                { elements: [], offset: 0 }
              ).elements}
              <text x="60" y="56" textAnchor="middle" fill="#f0f0f5" fontSize="18" fontWeight="700">{loading ? "—" : workers.length}</text>
              <text x="60" y="72" textAnchor="middle" fill="#8888a0" fontSize="10">Total</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
