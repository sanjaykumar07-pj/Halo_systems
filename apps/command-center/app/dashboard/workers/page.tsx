"use client";

import { useState, useEffect } from "react";
import styles from "./workers.module.css";
import { getWorkers, subscribeToWorkers } from "../../lib/supabase";

export default function WorkersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadWorkersData = () => {
    getWorkers()
      .then((data) => setAllWorkers(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWorkersData();
    const channel = subscribeToWorkers(() => loadWorkersData());
    return () => { channel.unsubscribe(); };
  }, []);

  const filtered = allWorkers.filter((w) => {
    if (typeFilter !== "all" && w.type !== typeFilter) return false;
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (search && !w.worker_id.includes(search) && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Workers</h2>
        <p className={styles.subtitle}>
          Live from database · {loading ? "Loading…" : `${allWorkers.length} total workers`}
        </p>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={styles.filterSelect} id="workers-type-filter">
          <option value="all">Type : All</option>
          <option value="janitor">Janitor</option>
          <option value="medic">Medic</option>
          <option value="security">Security</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filterSelect} id="workers-status-filter">
          <option value="all">Status : All</option>
          <option value="on-duty">On-Duty</option>
          <option value="completed">Completed</option>
          <option value="off-duty">Off-Duty</option>
          <option value="retired">Retired</option>
        </select>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            id="workers-search"
          />
        </div>
      </div>

      {/* Table */}
      <div className={`glass-card ${styles.tableCard}`}>
        {loading ? (
          <div className={styles.loadingRows}>
            {[...Array(8)].map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className={styles.th}>#</th>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Section</th>
                <th className={styles.th}>Lang</th>
                <th className={styles.th}>Efficiency</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((worker, i) => (
                <tr key={worker.worker_id} className={styles.tr}>
                  <td className={styles.td}>{i + 1}</td>
                  <td className={styles.td}><span className={styles.workerId}>{worker.worker_id}</span></td>
                  <td className={styles.td}>{worker.name}</td>
                  <td className={styles.td} style={{ textTransform: "capitalize" }}>{worker.type}</td>
                  <td className={styles.td}>{worker.section}</td>
                  <td className={styles.td}><span className={styles.langBadge}>{worker.language?.toUpperCase()}</span></td>
                  <td className={styles.td}>
                    <div className={styles.efficiencyCell}>
                      <div className={styles.effBar}>
                        <div className={styles.effFill} style={{ width: `${worker.efficiency}%` }} />
                      </div>
                      <span>{worker.efficiency}%</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={`badge badge-${worker.status}`}>{worker.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className={styles.emptyState}>No workers match your filters.</div>
        )}
      </div>
    </div>
  );
}
