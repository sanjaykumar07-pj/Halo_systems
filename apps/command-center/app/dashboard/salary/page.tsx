"use client";

import { useState, useEffect } from "react";
import styles from "./salary.module.css";
import { getSalary, processAllPayments, subscribeToSalary } from "../../lib/supabase";

export default function SalaryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadSalaryData = () => {
    getSalary()
      .then((data) => setSalaryData(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSalaryData();
    const channel = subscribeToSalary(() => loadSalaryData());
    return () => { channel.unsubscribe(); };
  }, []);

  const filtered = salaryData.filter((s) => {
    if (gradeFilter !== "all" && s.grade !== gradeFilter) return false;
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (statusFilter !== "all" && s.payment_status !== statusFilter) return false;
    return true;
  });

  const totalPayroll = filtered.reduce((sum, s) => sum + parseFloat(s.total ?? 0), 0);
  const paidCount = filtered.filter((s) => s.payment_status === "paid").length;
  const pendingCount = filtered.filter((s) => s.payment_status === "pending").length;
  const overdueCount = filtered.filter((s) => s.payment_status === "overdue").length;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Salary</h2>
          <p className={styles.subtitle}>{loading ? "Loading…" : `Pay period 2026-07 · ${salaryData.length} workers`}</p>
        </div>

        {/* Summary pills */}
        {!loading && (
          <div className={styles.summaryPills}>
            <div className={styles.pill} style={{ borderColor: "#4caf50" }}>
              <span className={styles.pillNum}>{paidCount}</span>
              <span className={styles.pillLabel}>Paid</span>
            </div>
            <div className={styles.pill} style={{ borderColor: "#ffa726" }}>
              <span className={styles.pillNum}>{pendingCount}</span>
              <span className={styles.pillLabel}>Pending</span>
            </div>
            <div className={styles.pill} style={{ borderColor: "#ef5350" }}>
              <span className={styles.pillNum}>{overdueCount}</span>
              <span className={styles.pillLabel}>Overdue</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <div className={styles.field}>
          <label className={styles.label}>Grade</label>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} id="salary-grade-filter">
            <option value="all">All Grades</option>
            <option value="A">Grade A (Medic)</option>
            <option value="B">Grade B (Security)</option>
            <option value="C">Grade C (Janitor)</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} id="salary-type-filter">
            <option value="all">All Types</option>
            <option value="janitor">Janitor</option>
            <option value="medic">Medic</option>
            <option value="security">Security</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="salary-status-filter">
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className={styles.payrollSummary}>
          <span className={styles.payrollLabel}>Total Payroll</span>
          <span className={styles.payrollAmount}>{loading ? "—" : `$${totalPayroll.toLocaleString("en", { minimumFractionDigits: 2 })}`}</span>
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
                <th className={styles.th}>Worker Name</th>
                <th className={styles.th}>Grade</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Section</th>
                <th className={styles.th}>Base Pay</th>
                <th className={styles.th}>Bonus</th>
                <th className={styles.th}>Total</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className={styles.tr}>
                  <td className={styles.td}>{s.worker_name}</td>
                  <td className={styles.td}><span className={styles.gradeBadge}>{s.grade}</span></td>
                  <td className={styles.td} style={{ textTransform: "capitalize" }}>{s.type}</td>
                  <td className={styles.td}>{s.section}</td>
                  <td className={styles.td}>${parseFloat(s.base_pay).toLocaleString()}</td>
                  <td className={styles.td}><span className={styles.bonus}>+${parseFloat(s.bonus).toLocaleString()}</span></td>
                  <td className={styles.td}><strong>${parseFloat(s.total).toLocaleString()}</strong></td>
                  <td className={styles.td}>
                    <span className={`${styles.payStatus} ${styles[`pay_${s.payment_status}`]}`}>{s.payment_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className={styles.emptyState}>No salary records match your filters.</div>
        )}
      </div>

      <div className={styles.actions}>
        <button 
          className="btn btn-primary" 
          id="process-payment"
          disabled={actionLoading || pendingCount === 0}
          onClick={async () => {
            setActionLoading(true);
            try {
              await processAllPayments();
            } catch(e) {
              console.error(e);
            } finally {
              setActionLoading(false);
            }
          }}
        >
          {actionLoading ? 'Processing...' : 'Process Payments'}
        </button>
      </div>
    </div>
  );
}
